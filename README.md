# ENRE-marker

ENRE-marker is a tool for manually label truth entities and relations analysed by well-known tools, and by making a set of ground-truth dataset, to help build better code analysis tools.

ENRE-marker is a VSCode extension where holds UI and main functionalities and a backend server where data stores at.

## Installation

1. Install [Visual Studio Code](https://code.visualstudio.com) (Short as VSCode below);

2. In built-in tab `EXTENSIONS`, search and install `Private Extension Manager
`;

> If successfully installed, an icon similar to VSCode's built-in `EXTENSIONS`'s will be appended to the tab bar whose topright is a triangle rather than a square.

3. Open VSCode's `settings` file by either of these options:

* Keyboard shortcut `Ctrl + Shift + P` (Windows) / `Command + Shift + P` (MacOS)

* In menu bar, click `View` > `Command Palette`

Then type `settings`, and select `Preferences: Open Settings (JSON)`, a file will be opened.

Appending configuration listed below to the settings file:

```json
"privateExtensions.registries": [
    {
        "name": "ENRE Team",
        "registry": "http://202.117.43.245:8001",
        "query": "ENRE"
    }
]
```

Save and closed the settings file.

4. Open `PRIVATE EXTENSIONS` tab, and an item named `ENRE-marker` should be displayed, click and in newly opened window click `Install` button, then `ENRE-marker` should be installed to your VSCode.

> NOTICE
> 
> You can only download ENRE-marker and use it's features **under the campus network**.
> 
> To use it outside the campus network, please change your WiFi AP to `XJTU_STU` or try to use university's [SSL VPN service](http://vpn.xjtu.edu.cn)

## Usage

After successfully install ENRE-marker, type `enre` in command palatte and select `ENRE-marker: Start`, a window should be displayed.

Initially it's a login page, login with uid and password we assigned to you, and then you could explore all features of ENRE-marker.

To view and mark a project, you should claim it first under the `projects` tab.

## Issues & Feature Requests

If you have encounted with bugs or crashes, please [open an issue](https://github.com/xjtu-enre/ENRE-marker/issues) to let us know and fix.

If you request some features that have not been shipped to ENRE-marker yet, you could also open an issue and discribe your request, we will kindly take your advices into our considerations.
