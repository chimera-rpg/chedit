package main

type Config struct {
	ArchetypesRoot *string `json:"ArchetypesRoot" yaml:"ArchetypesRoot"`
	MapsRoot       *string `json:"MapsRoot" yaml:"MapsRoot"`
	AudioRoot      *string `json:"AudioRoot" yaml:"AudioRoot"`
}

func (c *Config) MergeDefaults() {
	archetypesRoot := "../../share/chimera/archetypes"
	mapsRoot := "../../share/chimera/maps"
	audioRoot := "../../share/chimera/audio"
	if c.ArchetypesRoot == nil {
		c.ArchetypesRoot = &archetypesRoot
	}
	if c.MapsRoot == nil {
		c.MapsRoot = &mapsRoot
	}
	if c.AudioRoot == nil {
		c.AudioRoot = &audioRoot
	}
}

func (c *Config) String() string {
	var s string

	s += "ArchetypesRoot: " + *c.ArchetypesRoot + "\n"
	s += "MapsRoot: " + *c.MapsRoot + "\n"
	s += "AudioRoot: " + *c.AudioRoot + "\n"

	return s
}
