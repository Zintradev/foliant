!macro NSIS_HOOK_POSTINSTALL
  # Associate .foliant extension with Foliant.Project ProgID in current user registry
  WriteRegStr HKCU "Software\Classes\.foliant" "" "Foliant.Project"
  WriteRegStr HKCU "Software\Classes\.foliant\OpenWithProgids" "Foliant.Project" ""

  # Define Foliant.Project ProgID with description, dedicated file icon and open command
  WriteRegStr HKCU "Software\Classes\Foliant.Project" "" "Foliant Project File"
  WriteRegStr HKCU "Software\Classes\Foliant.Project\DefaultIcon" "" "$\"$INSTDIR\icons\file_icon.ico$\",0"
  WriteRegStr HKCU "Software\Classes\Foliant.Project\shell" "" "open"
  WriteRegStr HKCU "Software\Classes\Foliant.Project\shell\open" "" "Open with Foliant"
  WriteRegStr HKCU "Software\Classes\Foliant.Project\shell\open\command" "" "$\"$INSTDIR\foliant.exe$\" $\"%1$\""

  # Also ensure the ProgID registered by Tauri's APP_ASSOCIATE ("Foliant Project") uses the dedicated file icon
  WriteRegStr HKCU "Software\Classes\Foliant Project\DefaultIcon" "" "$\"$INSTDIR\icons\file_icon.ico$\",0"

  # Instantly refresh Windows Explorer file associations and icon cache
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  # Clean up registry keys created for .foliant file associations from HKCU
  DeleteRegKey HKCU "Software\Classes\.foliant"
  DeleteRegKey HKCU "Software\Classes\Foliant.Project"
  DeleteRegKey HKCU "Software\Classes\Foliant Project"

  # Instantly refresh Windows Explorer file associations and icon cache
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
