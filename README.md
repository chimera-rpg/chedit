# chedit -- cheesy chimera editor
Welcome to chedit, a newer iteration of the chimera map editor to be easier to write/work with. This has mostly reigned true, though unfamiliarity and use of the alpha wails software does mean the following:

> hic sunt dracones

This, of course, will not be an unfamiliar concept to any of the chimera codebase.

## Running
At the moment you will need go 1.18+, as there are no releases yet.

Install wails v2.0.0-beta.38, as there are some problems with their Svelte/vite support with higher versions as of 2022-07-22:

```
go install github.com/wailsapp/wails/v2/cmd/wails@v2.0.0-beta.38
```

Now it can be run with:

```
wails dev
```

Congratulations, you should now be able to create maps, edit them, and save them, albeit with some clunkiness and lack of documentation.

## Developing
Development is done using [Wails v2](https://wails.io/), Go for the backend, and Svelte for the frontend. There are some awkward kludges in place due to wails alpha behavior, especially in regards to the automatic backend<->frontend communication.

Almost all data is kept and manipulated on the frontend, with the backend being used to manage filesystem access and similar.
