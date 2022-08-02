package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	cdata "github.com/chimera-rpg/go-common/data"
	sdata "github.com/chimera-rpg/go-server/data"
	"gopkg.in/yaml.v2"
)

// ArchetypeContainer contains an archetype and its source.
type ArchetypeContainer struct {
	Archetype *sdata.Archetype `json:"Archetype"`
	Source    string           `json:"Source"`
	Interface interface{}      `json:"Interface"`
}

// Editor is our editor, yo.
type Editor struct {
	ctx              context.Context
	Archetypes       map[string]string              `json:"Archetypes"`
	Animations       map[string]*sdata.AnimationPre `json:"Animations"`
	AnimationsConfig cdata.AnimationsConfig         `json:"AnimationsConfig"`
	Config           Config                         `json:"Config"`
	ConfigDir        string
	compiled         bool
}

// NewEditor creates a new Editor application struct
func NewEditor() *Editor {
	return &Editor{
		Archetypes: make(map[string]string),
		Animations: make(map[string]*sdata.AnimationPre),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (e *Editor) startup(ctx context.Context) {
	e.ctx = ctx
}

// Initialize initializes our editor, including creating user directories, loading configuration, and loading assets.
func (e *Editor) Initialize() (err error) {
	// Load our animation config.
	if err := e.LoadAnimationsConfig(); err != nil {
		return err
	}

	// Load our assets.
	if err := e.CollectArchetypes(); err != nil {
		return err
	}
	if err := e.LoadAnimations(); err != nil {
		return err
	}

	// Print some info.
	fmt.Printf("%d archetypes, %d animations\n", len(e.Archetypes), len(e.Animations))
	return nil
}

// LoadAnimationsConfig loads the animations config file.
func (e *Editor) LoadAnimationsConfig() error {
	p := filepath.Join(*e.Config.ArchetypesRoot, "config.yaml")
	b, err := os.ReadFile(p)
	if err != nil {
		return err
	}
	if err := yaml.Unmarshal(b, &e.AnimationsConfig); err != nil {
		return err
	}
	return nil
}

// CollectArchetypes loads all archetypes in the archetypes root directory and stores them in our Archetypes field.
func (e *Editor) CollectArchetypes() error {
	e.Archetypes = make(map[string]string)
	err := filepath.Walk(*e.Config.ArchetypesRoot, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			if strings.HasSuffix(p, ".arch.yaml") {
				b, err := os.ReadFile(p)
				if err != nil {
					return err
				}

				e.Archetypes[p] = string(b)
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

// LoadAnimations loads all animations in our archetypes directory and stores them in our Animations field.
func (e *Editor) LoadAnimations() error {
	e.Animations = make(map[string]*sdata.AnimationPre)
	err := filepath.Walk(*e.Config.ArchetypesRoot, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			if strings.HasSuffix(p, ".anim.yaml") {
				b, err := os.ReadFile(p)
				if err != nil {
					return err
				}

				animationsMap := make(map[string]*sdata.AnimationPre)

				if err := yaml.Unmarshal(b, &animationsMap); err != nil {
					return err
				}
				for k, animation := range animationsMap {
					if _, ok := e.Animations[k]; ok {
						return fmt.Errorf("animation '%s' exists", k)
					}
					e.Animations[k] = animation
				}
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

// GetAnimationsConfig returns the animations config.
func (e *Editor) GetAnimationsConfigSource() (string, error) {
	p := filepath.Join(*e.Config.ArchetypesRoot, "config.yaml")
	b, err := os.ReadFile(p)
	return string(b), err
}

// GetArchetypes returns the archetypes field.
func (e *Editor) GetArchetypes() map[string]string {
	return e.Archetypes
}

// GetAnimations returns the animations field.
func (e *Editor) GetAnimations() map[string]*sdata.AnimationPre {
	return e.Animations
}

// MapReference is a container for a map that contains the current selected map as well as the source path. Most of its fields are intended for Wails use.
type MapReference struct {
	Path        string               `json:"Path"`
	Source      string               `json:"Source"`
	Maps        map[string]sdata.Map `json:"Maps"`
	SelectedMap string               `json:"SelectedMap"`
}

// LoadMap opens a file dialog and attempts to load a map from the selected file.
func (e *Editor) LoadMap(unmarshal bool) (*MapReference, error) {
	p, err := e.openMapDialog()
	if p == "" {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	b, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}

	mr := &MapReference{
		Path: p,
	}

	if unmarshal {
		m := make(map[string]sdata.Map)
		if err := yaml.Unmarshal(b, &m); err != nil {
			return nil, err
		}
		mr.Maps = m
	} else {
		mr.Source = string(b)
	}

	return mr, nil
}

func (e *Editor) SaveMap(mr *MapReference) error {
	r, err := e.saveMapDialog(mr.Path)
	if err != nil {
		return err
	}

	b, err := yaml.Marshal(mr.Maps)
	if err != nil {
		return err
	}

	if err := os.WriteFile(r, b, 0755); err != nil {
		return err
	}

	return nil
}

// GetBytes gets bytes from a file relative to the archetypes root directory.
func (e *Editor) GetBytes(p string) ([]byte, error) {
	p = filepath.Join(*e.Config.ArchetypesRoot, p)
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (e *Editor) SaveSettings(s string) error {
	p := filepath.Join(e.ConfigDir, "settings.yml")
	err := os.WriteFile(p, []byte(s), 0755)
	return err
}

func (e *Editor) LoadSettings() (string, error) {
	p := filepath.Join(e.ConfigDir, "settings.yml")
	b, err := os.ReadFile(p)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

type Settings struct {
	Width  int `yaml:"width"`
	Height int `yaml:"height"`
}
