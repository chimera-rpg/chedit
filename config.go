package main

// Config represents our editor's configuration file. This is saved to the program's user data directory.
type Config struct {
	ArchetypesRoot *string `json:"ArchetypesRoot" yaml:"ArchetypesRoot"`
	MapsRoot       *string `json:"MapsRoot" yaml:"MapsRoot"`
	AudioRoot      *string `json:"AudioRoot" yaml:"AudioRoot"`
}

// MergeDefaults merges the defaults with the given configuration.
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

// String returns a cleaner printable representation of the configuration file.
func (c *Config) String() string {
	var s string

	s += "ArchetypesRoot: " + *c.ArchetypesRoot + "\n"
	s += "MapsRoot: " + *c.MapsRoot + "\n"
	s += "AudioRoot: " + *c.AudioRoot + "\n"

	return s
}
