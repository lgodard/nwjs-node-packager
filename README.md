# nwjs-node-packager

A tool to build distributable packages of an NW.js application.

Running on Linux, it targets Linux, Windows and OSX platforms.

It can optionally replace the js file with a V8 snapshot to avoid directly reading the source code.

Usage
====
```shell
$ npm start -- --params ./my-builder-params.js
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
            app_name: 'Application_Name', // your application name
            app_version: '0.0.0', // application version
            description: 'Application description for the installer',
            licence: 'MIT',
            win_ico_path: '',
            user_install: true // local installation - no need of admin rights for installer
        }
    },
    // Linux
    {
        os: 'linux',
        arch: 'x64'
    }
];
```

If your application uses Webpack, it has to be built separately.

The application will download needed NW.js engines

Credits
======
based on https://github.com/Gisto/nwjs-shell-builder

License
=====
MIT
