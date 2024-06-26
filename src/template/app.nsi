;;; Define your application name
!define APPNAME "NWJS_APP_REPLACE_APPNAME"
!define APPNAMEANDVERSION "${APPNAME} NWJS_APP_REPLACE_VERSION"

;;; Main Install settings
NWJS_APP_REPLACE_USER_LEVEL
Name "${APPNAMEANDVERSION}"
InstallDir "NWJS_APP_REPLACE_TARGET_WIN_DIR\${APPNAME}"
InstallDirRegKey NWJS_APP_REPLACE_REGISTRY "Software\${APPNAME}" ""
OutFile "NWJS_APP_REPLACE_EXE_NAME"

;;; Detect running
;;; https://nsis.sourceforge.io/Check_whether_your_application_is_running#Using_a_window_class_or_title
Section DetectRunning

    !define DETECT_RUNNING "NWJS_APP_DETECT_RUNNING"

    StrCmp DETECT_RUNNING 0 notRunning

        !define MAIN_WINDOW_TITLE "NWJS_APP_MAIN_WINDOW_TITLE"
        !define ALREADY_RUNNING_MESSAGE "NWJS_APP_ALREADY_RUNNING_MESSAGE"

        FindWindow $0 "" "${MAIN_WINDOW_TITLE}"
        StrCmp $0 0 notRunning
                MessageBox MB_OK|MB_ICONEXCLAMATION "${ALREADY_RUNNING_MESSAGE}" /SD IDOK
                Abort

    notRunning:

SectionEnd

;;; Modern interface settings
!include "MUI.nsh"
!define MUI_ABORTWARNING

;; Launch when finished
!define MUI_FINISHPAGE_RUN $INSTDIR\nw.exe
!define MUI_FINISHPAGE_RUN_PARAMETERS "app"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;;; Set languages (first is default language)
!insertmacro MUI_LANGUAGE "NWJS_APP_REPLACE_INSTALL_LANGUAGE"
!insertmacro MUI_RESERVEFILE_LANGDLL

Section "${APPNAME}" Section1

	;;; Set Section properties
	SetOverwrite on

	;;; Set Section Files and Shortcuts
	SetOutPath "$INSTDIR\"
	File /r "NWJS_APP_REPLACE_SOURCE_DIRECTORY/*"

	CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\nw.exe" "app" "$INSTDIR\app\NWJS_APP_REPLACE_INC_FILE_ICO"
	CreateDirectory "$SMPROGRAMS\${APPNAME}"
	CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\nw.exe" "app" "$INSTDIR\app\NWJS_APP_REPLACE_INC_FILE_ICO"
	CreateShortCut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "" 0

SectionEnd

Section -FinishSection

	WriteRegStr NWJS_APP_REPLACE_REGISTRY "SOFTWARE\${APPNAME}" "" "$INSTDIR"
	WriteRegStr NWJS_APP_REPLACE_REGISTRY "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
	WriteRegStr NWJS_APP_REPLACE_REGISTRY "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteUninstaller "$INSTDIR\uninstall.exe"

SectionEnd

;;; Modern install component descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${Section1} ""
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;;; Uninstall section
Section Uninstall

	;;; Remove from registry...
	DeleteRegKey NWJS_APP_REPLACE_REGISTRY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
	DeleteRegKey NWJS_APP_REPLACE_REGISTRY "SOFTWARE\${APPNAME}"

	;;; Delete self
	Delete "$INSTDIR\uninstall.exe"

	;;; Delete Shortcuts
	Delete "$DESKTOP\${APPNAME}.lnk"
	Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
	Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"

	;;; Clean up ${APPNAME}
	RMDir /r /REBOOTOK $INSTDIR
	RMDir "$SMPROGRAMS\${APPNAME}"

SectionEnd

BrandingText "NWJS_APP_REPLACE_DESCRIPTION"

;;; eof
