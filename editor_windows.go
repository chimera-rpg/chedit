package main

import "github.com/sqweek/dialog"

func (e *Editor) openMapDialog() (string, error) {
	return dialog.File().Filter("Map Files", "map.yaml", "map.yml").SetStartDir(*e.Config.MapsRoot).Load()
}
