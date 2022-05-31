package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	sdata "github.com/chimera-rpg/go-server/data"
	"gopkg.in/yaml.v2"
)

// Editor is our editor, yo.
type Editor struct {
	ctx        context.Context
	Archetypes map[string]*sdata.Archetype    `json:"Archetypes"`
	Animations map[string]*sdata.AnimationPre `json:"Animations"`
	Config     Config                         `json:"Config"`
}

// NewEditor creates a new Editor application struct
func NewEditor() *Editor {
	return &Editor{
		Archetypes: make(map[string]*sdata.Archetype),
		Animations: make(map[string]*sdata.AnimationPre),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (e *Editor) startup(ctx context.Context) {
	e.ctx = ctx
}

func (e *Editor) Initialize() (err error) {
	// Ensure our system directories are available.
	configDir, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	configDir = filepath.Join(configDir, "chimera", "editor")

	err = os.MkdirAll(configDir, 0755)
	if err != nil {
		return err
	}

	configPath := filepath.Join(configDir, "cfg.yml")

	// Load our configuration.
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Create a default config file.
		b, _ := yaml.Marshal(&e.Config)
		if err := os.WriteFile(configPath, b, 0755); err != nil {
			return err
		}
	} else if err != nil {
		return err
	} else {
		b, err := os.ReadFile(configPath)
		if err != nil {
			return err
		}
		if err := yaml.Unmarshal(b, &e.Config); err != nil {
			return err
		}
	}
	e.Config.MergeDefaults()

	fmt.Println(e.Config.String())

	// Load our assets.
	if err := e.LoadArchetypes(); err != nil {
		return err
	}
	if err := e.LoadAnimations(); err != nil {
		return err
	}
	if err := e.LoadMaps(); err != nil {
		return err
	}

	// Print some info.
	fmt.Printf("%d archetypes, %d animations\n", len(e.Archetypes), len(e.Animations))
	return nil
}

func (e *Editor) LoadArchetypes() error {
	e.Archetypes = make(map[string]*sdata.Archetype)
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

				archetypesMap := make(map[string]*sdata.Archetype)

				if err := yaml.Unmarshal(b, &archetypesMap); err != nil {
					return err
				}
				for k, archetype := range archetypesMap {
					if _, ok := e.Archetypes[k]; ok {
						return fmt.Errorf("archetype '%s' exists", k)
					}
					e.Archetypes[k] = archetype
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

func (e *Editor) GetArchetypes() map[string]*sdata.Archetype {
	return e.Archetypes
}

func (e *Editor) GetAnimations() map[string]*sdata.AnimationPre {
	return e.Animations
}

func (e *Editor) LoadMaps() error {
	fmt.Println("TODO: somehow load maps")
	return nil
}

func (e *Editor) GetBytes(p string) ([]byte, error) {
	p = filepath.Join(*e.Config.ArchetypesRoot, p)
	fmt.Println("okay, getting bytes from", p)
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	return b, nil
}
