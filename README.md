<h1 align="center">
  <br>
    <img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/icon.png?branch=master" alt="logo" width="200">
  <br>
  VS Code - TizenTV
  <br>
  <br>
</h1>

<h4 align="center">Generate/Edit/Package/Run/Debug your applications with Tizen Targets</h4>

<p align="center">
  <a href="https://github.com/samsung/vscode-extension-tizentv"><img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/buildpassing.png?branch=master" alt="Source"></a>
  <a href="https://github.com/samsung/vscode-extension-tizentv/releases"><img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/release.png?branch=master" alt="Release"></a>
  <a href="https://github.com/samsung/vscode-extension-tizentv/wiki"><img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/chatter.png?branch=master" alt="Wiki"></a>
</p>

'TizenTV' is a VS Code extension that provides a lightweight IDE for Tizen application developers, helps to generate, update and package an application, also run and debug an application on Tizen targets.

![Demo](https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/demo.gif)

## Supported features 
* Tizen TV: Build Package  
  Build the Tizen application into a Tizen package, the package will be located in workspace's root 
* Tizen TV: Certificate Manager  
  Create/Retrieve/Update/Delete an author's profile by tizentv
* Tizen TV: Create Web Project  
  Create a Tizen web application based on templates
* Tizen TV: Run on TV  
  Run Tizen application on tizen TV, please configure the target address in user setting, also set TV as developer mode  
* Tizen TV: Run on TV Simulator  
  Run Tizen web application on TV Simulator, please configure simultor's executable location in user setting  
* Tizen TV: Run TV Emulator Manager & Tizen TV: Run on TV Emulator  
  Run Tizen application on TV Emulator, please configure Tizen Studio's location, and a Emulator instance should be started  
* Tizen TV: SDB Command Promote  
  Open SDB in shell to help execute the SDB commands you want  
* Tizen TV: Web Inspector on Emulator & Tizen TV: Web Inspector on TV  
  Use google-chrome to debug with web inspector, please configure the chrome executable's path in user setting   
* Tizen TV: Set Exception Path  
  Set Exception Path for package   
* Debugger: Tizen 3.0/4.0(TV)  
  Add breakpoints in application and debug source code on Tizen TV  
* Debugger: TV Simulator  
  Add breakpoints in application and debug source code on TV Simulator  
* Debugger: Tizen 3.0/4.0(Emulator)  
  Add breakpoints in web application and debug functions on TV Emulator  

## Getting Started
The extension supports most of the basic features required to develop a Tizen TV app. It supports to create application using predefined templates, package the application, sign the application using certificate profile, launch a command prompt to execute sdb commands, run or debug application on TV Simulator, Emulator and Tizen TV.

### Setup Environment  
1. Install latest VS Code release  
   *https://code.visualstudio.com*  
   *https://code.visualstudio.com/docs/setup/setup-overview* 
2. Execute *ext install tizentv* in command pallete(or clone tizentv-1.0.0.vsix from github, install with terminal command)  
   *#code --install-extension tizentv-1.0.0.vsix*  
3. Start/Restart VS Code  
4. Use F1 to open the palette and input *>Tizen* to find commands 
5. Use F5 to find debuggers 
<p><img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/featurelist.png" alt="feature list"></p>  

### Command Configuration  
For running/debugging an app, please configure one of below items:  
File > Preferences > User Settings or Code >Preferences > User Settings  
* tizentv.simulatorLocation  
  Configuration of TV simulator's executable location  
* tizentv.tizenStudioLocation  
  Configuration of Tizen Studio's location  
* tizentv.chromeExecutable  
  Configuration of chrome executable's path  
* tizentv.targetDeviceAddress  
  Configuration of target TV's IP and port  
* tizentv.certificateManager 
  Opitional parameters for creating certification profile 
<p><img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/setting.png" alt="setting"></p>

### Debugger Configuration
If the launch.json is not yet configured, please configure the launching item
* runtimeLocation  
  Set the TV Simulator's location for debug on TV simulator  
* targetIp  
  Set the target TV's IP for debug on TV  
<p><img src="https://raw.githubusercontent.com/samsung/vscode-extension-tizentv/master/images/debugsetting.png" alt="debug setting"></p>


## F.A.Q
Please get contact points at below:  
`a.devendra@samsung.com`  
`hc.jiang@samsung.com`  


