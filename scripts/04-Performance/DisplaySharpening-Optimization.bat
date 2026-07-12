@echo off
chcp 65001 > nul
color 4
@REM mode 1500
SETLOCAL EnableDelayedExpansion
Title Bayjiy Keskinleştirme

echo. BBBBBBBBBBBBBBBBB                                                      JJJJJJJJJJJ   iiii                          
echo. B::::::::::::::::B                                                     J:::::::::J  i::::i                         
echo. B::::::BBBBBB:::::B                                                    J:::::::::J   iiii                          
echo. BB:::::B     B:::::B                                                   JJ:::::::JJ                               
echo.   B::::B     B:::::B    aaaaaaaaaaaaa  yyyyyyy           yyyyyyy         J:::::J   iiiiiiii  yyyyyyy         yyyyyyy
echo.   B::::B     B:::::B    a::::::::::::a  y:::::y         y:::::y          J:::::J   i::::::i  y:::::y         y:::::y 
echo.   B::::BBBBBB:::::B     aaaaaaaaa:::::a  y:::::y       y:::::y           J:::::J    i::::i    y:::::y       y:::::y  
echo.   B:::::::::::::BB               a::::a   y:::::y     y:::::y            J:::::j    i::::i     y:::::y     y:::::y   
echo.   B::::BBBBBB:::::B       aaaaaaa:::::a    y:::::y   y:::::y             J:::::J    i::::i      y:::::y   y:::::y    
echo.   B::::B     B:::::B    aa::::::::::::a     y:::::y y:::::y  JJJJJJJ     J:::::J    i::::i       y:::::y y:::::y     
echo.   B::::B     B:::::B   a::::aaaa::::::a      y:::::y:::::y   J:::::J     J:::::J    i::::i        y:::::y:::::y      
echo.   B::::B     B:::::B  a::::a    a:::::a       y:::::::::y    J::::::J   J::::::J    i::::i         y:::::::::y       
echo. BB:::::BBBBBB::::::B  a::::a    a:::::a        y:::::::y     J:::::::JJJ:::::::J   i::::::i         y:::::::y        
echo. B:::::::::::::::::B   a:::::aaaa::::::a         y:::::y       JJ:::::::::::::JJ    i::::::i          y:::::y         
echo. B::::::::::::::::B     a::::::::::aa:::a       y:::::y          JJ:::::::::JJ      i::::::i         y:::::y          
echo. BBBBBBBBBBBBBBBBB       aaaaaaaaaa  aaaa      y:::::y             JJJJJJJJJ        iiiiiiii        y:::::y           
echo.                                              y:::::y                                              y:::::y            
echo.                                             y:::::y                                              y:::::y             
echo.                                            y:::::y                                              y:::::y              
echo.                                           y:::::y                                              y:::::y               
echo.                                          yyyyyyy                                              yyyyyyy                
echo. 							
echo.                                     Bayjiy Nvidia Keskinleştirme Açılıyor...
Echo	Dosyayı yönetici olarak çalıştırmayı unutmayın...
timeout /t 3 /nobreak  >nul 2>&1

for /f "delims=" %%a in ('powershell -command "(nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits)"') do set DRIVER_VERSION=%%a

echo Sürücü versiyonu: %DRIVER_VERSION%

if %DRIVER_VERSION% LSS 566.45 (
    reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\nvlddmkm\FTS" /v EnableGR535 /t REG_DWORD /d 0 /f
)

if %DRIVER_VERSION% GEQ 571.96 (
    reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\nvlddmkm\Parameters\FTS" /v EnableGR535 /t REG_DWORD /d 0 /f
)

echo Driver versiyonuna göre ayarlama yapılıyor. Lütfen bekleyin... -BayJiy
timeout /t 5 /nobreak  >nul 2>&1
echo Yapan: BayJiy

timeout /t 5 /nobreak  >nul 2>&1
start "" "https://dsc.gg/bayjiy"

