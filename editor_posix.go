//go:build aix || darwin || dragonfly || freebsd || (js && wasm) || linux || nacl || netbsd || openbsd || solaris
// +build aix darwin dragonfly freebsd js,wasm linux nacl netbsd openbsd solaris

package main

import "github.com/wailsapp/wails/v2/pkg/runtime"

func (e *Editor) openMapDialog() (string, error) {
	return runtime.OpenFileDialog(e.ctx, runtime.OpenDialogOptions{
		DefaultDirectory: *e.Config.MapsRoot,
		Title:            "Open a map",
		Filters: []runtime.FileFilter{runtime.FileFilter{
			DisplayName: "Map Files (*.map.yaml)",
			Pattern:     "*.map.yaml;*.map.yml",
		},
		},
	})
}
