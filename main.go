package main

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"

	sdata "github.com/chimera-rpg/go-server/data"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"gopkg.in/yaml.v2"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	// Create an instance of the app structure
	editor := NewEditor()

	// Ensure our system directories are available.
	configDir, err := os.UserConfigDir()
	if err != nil {
		panic(err)
	}
	editor.ConfigDir = filepath.Join(configDir, "chimera", "editor")

	err = os.MkdirAll(configDir, 0755)
	if err != nil {
		panic(err)
	}

	configPath := filepath.Join(editor.ConfigDir, "cfg.yml")

	// Load our configuration.
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Create a default config file.
		b, _ := yaml.Marshal(&editor.Config)
		if err := os.WriteFile(configPath, b, 0755); err != nil {
			panic(err)
		}
	} else if err != nil {
		panic(err)
	} else {
		b, err := os.ReadFile(configPath)
		if err != nil {
			panic(err)
		}
		if err := yaml.Unmarshal(b, &editor.Config); err != nil {
			panic(err)
		}
	}
	editor.Config.MergeDefaults()

	fmt.Println(editor.Config.String())

	// Attempt to load our settings file.
	var settings Settings
	settingsSrc, err := editor.LoadSettings()
	yaml.Unmarshal([]byte(settingsSrc), &settings)

	if settings.Width <= 0 {
		settings.Width = 1280
	}
	if settings.Height <= 0 {
		settings.Height = 720
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "chedit",
		Width:     settings.Width,
		Height:    settings.Height,
		Assets:    assets,
		OnStartup: editor.startup,
		Bind: []interface{}{
			editor,
			&sdata.Damage{},
		},
		Linux: &linux.Options{
			Icon: icon,
		},
	})

	if err != nil {
		println("Error:", err)
	}
}
