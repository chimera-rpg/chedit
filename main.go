package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed frontend/dist
var assets embed.FS

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
		},
	})

	if err != nil {
		println("Error:", err)
	}
}
