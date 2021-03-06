const COMMON = {
    // The directory containing your NWJS script
    // has to be built if using webpack for example
    source_dir: '../../../my-nwjs-script/dist',
    // the directory where NWJS binaries will be donwloaded and uncompressed
    // this directoru can be kept to avoid new downloads
    working_dir: './wrk_nwjs',
    // the directory where final packages will be available
    output_dir: './dist',
    // the nwjs version your script uses
    nwjs_version: '0.45.4',
    // the base url for NWJS redistribuables
    nwjs_url: 'http://dl.nwjs.io',
    // clean working_dir to force NWJS binaries download
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
    // windows
    {
        os: 'win',
        arch: 'x64', // can bie ia32
        // creates a nsis installer
        installer: {
            app_name: 'Application_Name', // your application name
            app_version: '0.0.0', // application version
            description: 'Application description for the installer',
            licence: 'MIT',
            win_ico_path: '',
            user_install: true // local installation - no need of admin rights for installer
        }
    },
    // linux
    {
        os: 'linux',
        arch: 'x64'
    }
];

module.exports = {
    COMMON,
    PLATFORMS
};