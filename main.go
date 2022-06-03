package main

import (
	"embed"

	sdata "github.com/chimera-rpg/go-server/data"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	// Create an instance of the app structure
	editor := NewEditor()

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "chedit",
		Width:     1280,
		Height:    720,
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
