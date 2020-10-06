;;; Define your application name
!define APPNAME "NWJS_APP_REPLACE_APPNAME"
!define APPNAMEANDVERSION "${APPNAME} NWJS_APP_REPLACE_VERSION"

;;; Main Install settings
RequestExecutionLevel user
Name "${APPNAMEANDVERSION}"
InstallDir "$LOCALAPPDATA\${APPNAME}"
InstallDirRegKey HKCU "Software\${APPNAME}" ""
OutFile "NWJS_APP_REPLACE_EXE_NAME"

;;; Modern interface settings
!include "MUI.nsh"
;;!define MUI_ICON "NWJS_APP_REPLACE_INC_FILE_ICO"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\nw.exe app"

!insertmacro MUI_PAGE_WELCOME
;;!insertmacro MUI_PAGE_LICENSE "NWJS_APP_REPLACE_LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;;; Set languages (first is default language)
!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_RESERVEFILE_LANGDLL

Section "${APPNAME}" Section1

	;;; Set Section properties
	SetOverwrite on

	;;; Set Section Files and Shortcuts
	SetOutPath "$INSTDIR\"
	File /r "NWJS_APP_SOURCE_DIRECTORY/*"

;;	CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" $INSTDIR\NWJS_APP_REPLACE_ICO_FILE_NAME" 0
	CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\nw.exe" "app" "" 0
	CreateDirectory "$SMPROGRAMS\${APPNAME}"
	CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\nw.exe" "app" "" 0
	CreateShortCut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "" 0

SectionEnd

Section -FinishSection

	WriteRegStr HKCU "Software\${APPNAME}" "" "$INSTDIR"
	WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
	WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$INSTDIR\uninstall.exe"
	WriteUninstaller "$INSTDIR\uninstall.exe"

SectionEnd

;;; Modern install component descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${Section1} ""
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;;; Uninstall section
Section Uninstall

	;;; Remove from registry...
	DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
	DeleteRegKey HKCU "SOFTWARE\${APPNAME}"

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
