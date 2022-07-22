These structures be:

  * files
    * **style.css**
      * Global stylesheet
    * **main.ts**
      * DOM to Svelte mount
    * **Editor.svelte**
      * Root component used to render sections and otherwise.
  * directories
    * **assets**
      * Files/folders packaged with the build and used from Svelte in the UI and beyond.
    * **components**
      * Highly reusable generic components, such menu systems.
    * **interfaces**
      * General interfaces to both Chimera types as well as chedit's types.
        * NOTE: Unfortunately wails' automatic type/interface bridging doesn't handle Chimera's `server/data` types terribly well, nor are they necessarily the best form, since there is expected compilation and live usage that causes certain fields to be unpopulated or populated. As such, the Archetype and Map interfaces contains a reimplementation of the native data type.
    * **models**
      * Some dubious models, functions, etc. for general editor usage.
    * **sections**
      * The bulk of chedit's Svelte structure components.
    * **stores**
      * Svelte stores for ensuring cross-component updating and synchronization of maps, archetypes, settings, and more.