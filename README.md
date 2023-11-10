# nwjs-node-packager

A tool to build distributable packages of an NW.js application.

Running on Linux, it targets Linux, Windows and OSX platforms.

It can optionally replace the js file with a V8 snapshot to avoid directly reading the source code.

CLI Usage
====
```shell
$ npm start -- --params ./my-builder-params.js

$ npx nwjs_node_packager --params ./my-builder-params.js
```

If no file for `--params` is given, the default configuration from `params.example.js` will be used.

Parameters
====
```js
const COMMON = {
    // The directory containing your NW.js script
    // has to be built if using Webpack for example
    source_dir: '../../../my-nwjs-script/dist',
    // the directory where NW.js binaries will be donwloaded and decompressed
    // this directory can be kept to avoid new downloads
    working_dir: './wrk_nwjs',
    // the directory where final packages will be available
    output_dir: './dist',
    // the NW.js version your script uses
    nwjs_version: '0.45.4',
    // the base url for NW.js redistributables
    nwjs_url: 'http://dl.nwjs.io',
    // clean working_dir to force NW.js binaries download
    force_nwjs_download: false,
    // nwjs locales to be distributed ! Note mandatory en*
    nwjs_locales: ['fr', 'en-GB', 'en-US', 'en*'],
    // replaces the app script with a binary V8 snapshot
    protect_script: true,
    // the html file loading the app script
    // only if protect_script
    built_html: 'index.html',
    // the app script name
    // the following string will be searched for replacement
    // <script type="text/javascript" src="${params.built_script}"></script>
    // only if protect_script
    built_script: 'app.js',
};

const PLATFORMS = [
    // array for cross-packaging
    // Windows
    {
        os: 'win',
        arch: 'x64', // can be ia32
        // creates an NSIS installer
        installer: {
            type: ['exe', 'msi'], // each targeted windows installer
            app_name: 'Application_Name', // your application name
            app_version: '0.0.0', // application version
            description: 'Application description for the installer',
            licence: 'MIT',
            win_ico_filename: 'my_image.ico', // must be in source_dir
            user_install: true, // local installation - no need of admin rights for installer
            language: 'French',
            
            // msi required
            wixl_relative_path: true, // needed setting since debian 12 & wixl 0.101
            upgradeCode: 'My-Upgrade-Code',
            manufacturer: 'My-manufacturer-Id',
            msi_language: 1036 // 1033 english, 1036 french
        },
        external_files: [
            {
                source_filepath: '/path/to/a/file/doc.pdf',
                target_filepath: 'sub1/sub2/my_doc.pdf' // directories will be created in package
            },
            {
                source_filepath: '/path/to/a/second/file/other_doc.pdf' // file we be copied in package's root
            },
        ],
    },
    // Linux
    {
        os: 'linux',
        arch: 'x64'
    },
    // MacOs
    {
        os: 'osx',
        arch: 'x64',
        installer: { // needs sudo
            app_name: 'Application_Name', // your application name
            app_version: '0.0.0', // application version
            osx_ico_filename: 'app.icns'
        },
        protect: { // Caution : only use one of these entries ssh || bin_path
            ssh: 'user@ip', // ssh address to an osx platform
            // OR
            bin_path: '~/temp/toto.bin', // path to bin file
        },
        external_files: [
            {
                source_filepath: '/path/to/a/file/doc.pdf',
                target_filepath: 'sub1/sub2/my_doc.pdf' // directories will be created in package
            }
        ],
    }
];
```

If your application uses Webpack, it has to be built separately.

The application will download needed NW.js engines

Windows Installer requirements
=======
- default installer `exe` needs `nsis` linux package
- `msi` installer needs `wixl` linux package
- `msi` : Since `debian 12`, with `wixl 0.101`, the `File` source paths in generated `.wixl` file need to be relative. The parameter `wixl_relative_path` allow this.


OSX specific
=======
- OSX installer producing `dmg` file needs `sudo`
- protect : uses `ssh` if both entries are present

Credits
======
based on https://github.com/Gisto/nwjs-shell-builder

License
=====
MIT
