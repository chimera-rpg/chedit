package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	sdata "github.com/chimera-rpg/go-server/data"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v2"
)

type ArchetypeContainer struct {
	Archetype *sdata.Archetype `json:"Archetype"`
	Source    string           `json:"Source"`
	Interface interface{}      `json:"Interface"`
}

// Editor is our editor, yo.
type Editor struct {
	ctx        context.Context
	Archetypes map[string]ArchetypeContainer  `json:"Archetypes"`
	Animations map[string]*sdata.AnimationPre `json:"Animations"`
	Config     Config                         `json:"Config"`
	compiled   bool
}

// NewEditor creates a new Editor application struct
func NewEditor() *Editor {
	return &Editor{
		Archetypes: make(map[string]ArchetypeContainer),
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

	// Compile stuff.
	if err := e.CompileArchetypes(); err != nil {
		return err
	}

	// Print some info.
	fmt.Printf("%d archetypes, %d animations\n", len(e.Archetypes), len(e.Animations))
	return nil
}

func (e *Editor) LoadArchetypes() error {
	e.Archetypes = make(map[string]ArchetypeContainer)
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
					archetype.Self = k
					e.Archetypes[k] = ArchetypeContainer{
						Archetype: archetype,
						Source:    string(b),
					}
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

func (e *Editor) CompileArchetypes() error {
	for _, a := range e.Archetypes {
		if err := e.resolveArchetype(a.Archetype); err != nil {
			return err
		}
	}
	for _, a := range e.Archetypes {
		if _, err := e.CompileArchetype(a.Archetype); err != nil {
			return err
		}
	}
	e.compiled = true
	return nil
}

func (e *Editor) CompileArchetype(a *sdata.Archetype) (*sdata.Archetype, error) {
	if a.IsCompiled() || a.IsCompiling() {
		return a, nil
	}
	a.SetCompiling(true)

	if err := e.resolveArchetype(a); err != nil {
		return a, err
	}

	if len(a.Archs) == 0 && a.Arch != "" {
		a.Archs = append(a.Archs, a.Arch)
	}
	for _, dep := range a.Archs {
		shouldMerge := true
		if dep[0] == '+' {
			dep = dep[1:]
			shouldMerge = false
		}
		ac2, ok := e.Archetypes[dep]
		if !ok {
			return a, fmt.Errorf("missing dep %s", dep)
		}
		a2 := ac2.Archetype
		if !e.compiled {
			if _, err := e.CompileArchetype(a2); err != nil {
				return a, err
			}
		}
		if shouldMerge {
			if err := a.Merge(a2); err != nil {
				return a, err
			}
		} else {
			if err := a.Add(a2); err != nil {
				return a, err
			}
		}
	}

	for i := range a.Inventory {
		if _, err := e.CompileArchetype(&a.Inventory[i]); err != nil {
			return a, err
		}
	}

	// Ensure Events' archetypes are compiled.
	compileEventResponses := func(er *sdata.EventResponses) {
		if er == nil {
			return
		}
		// FIXME: For now, do not compile events.
		return
		if er.Spawn != nil {
			for _, a := range er.Spawn.Items {
				e.CompileArchetype(a.Archetype)
			}
		}
		if er.Replace != nil {
			for _, a := range *er.Replace {
				e.CompileArchetype(a.Archetype)
			}
		}
	}
	if a.Events != nil {
		compileEventResponses(a.Events.Birth)
		compileEventResponses(a.Events.Death)
		compileEventResponses(a.Events.Advance)
		compileEventResponses(a.Events.Hit)
	}

	a.SetCompiled(true)

	return a, nil
}

func (e *Editor) resolveArchetype(archetype *sdata.Archetype) error {
	resolved := make(map[string]struct{})
	unresolved := make(map[string]struct{})

	if err := e.dependencyResolveArchetype(archetype, resolved, unresolved); err != nil {
		return err
	}
	return nil
}

func (e *Editor) dependencyResolveArchetype(archetype *sdata.Archetype, resolved, unresolved map[string]struct{}) error {
	unresolved[archetype.Self] = struct{}{}
	for _, dep := range archetype.Archs {
		if dep[0] == '+' {
			dep = dep[1:]
		}
		depArch := e.GetArchetype(dep)
		if depArch == nil {
			return fmt.Errorf("%s missing", dep)
		}
		if _, ok := resolved[dep]; !ok {
			if _, ok := unresolved[dep]; ok {
				return fmt.Errorf("circular dependency between %s and %s", archetype.Self, dep)
			}
			if err := e.dependencyResolveArchetype(depArch, resolved, unresolved); err != nil {
				return err
			}
		}
	}
	resolved[archetype.Self] = struct{}{}
	delete(unresolved, archetype.Self)

	return nil
}

func (e *Editor) GetArchetype(n string) *sdata.Archetype {
	ac, ok := e.Archetypes[n]
	if !ok {
		return nil
	}
	return ac.Archetype
}

func (e *Editor) GetArchetypes() map[string]ArchetypeContainer {
	return e.Archetypes
}

func (e *Editor) GetAnimations() map[string]*sdata.AnimationPre {
	return e.Animations
}

func (e *Editor) LoadMaps() error {
	fmt.Println("TODO: somehow load maps")
	return nil
}

type MapReference struct {
	Path        string               `json:"Path"`
	Maps        map[string]sdata.Map `json:"Maps"`
	SelectedMap string               `json:"SelectedMap"`
}

func (e *Editor) LoadMap() (*MapReference, error) {
	p, err := runtime.OpenFileDialog(e.ctx, runtime.OpenDialogOptions{
		DefaultDirectory: *e.Config.MapsRoot,
		Title:            "Open a map",
		Filters: []runtime.FileFilter{runtime.FileFilter{
			DisplayName: "Map Files (*.map.yaml)",
			Pattern:     "*.map.yaml;*.map.yml",
		},
		},
	})
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

	m := make(map[string]sdata.Map)
	if err := yaml.Unmarshal(b, &m); err != nil {
		return nil, err
	}

	return &MapReference{
		Path: p,
		Maps: m,
	}, nil
}

func (e *Editor) GetBytes(p string) ([]byte, error) {
	p = filepath.Join(*e.Config.ArchetypesRoot, p)
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	return b, nil
}
