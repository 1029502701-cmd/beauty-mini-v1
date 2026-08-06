import sys 
Add-Type -AssemblyName System.Windows.Forms  
Add-Type -AssemblyName System.Drawing 
public class W { 
    [DllImport(\" "gdi32.dll\)] public static extern IntPtr SelectObject(IntPtr h,IntPtr o); 
    [DllImport(\" "user32.dll\)] public static extern IntPtr FindWindow(string c,string n); 
using System;  
using System.Runtime.InteropServices; 
    [DllImport(\" "user32.dll\)] public static extern bool SetForegroundWindow(IntPtr h); 
    [DllImport(\" "gdi32.dll\)] public static extern bool DeleteObject(IntPtr o); 
    [DllImport(\" "user32.dll\)] public static extern bool GetWindowRect(IntPtr h,out RECT r); 
} 
    [DllImport(\" "gdi32.dll\)] public static extern bool DeleteDC(IntPtr h); 
    [DllImport(\" "user32.dll\)] public static extern int ReleaseDC(IntPtr h,IntPtr d); 
    [StructLayout(LayoutKind.Sequential)] public struct RECT{public int Left;public int Top;public int Right;public int Bottom;} 
Write-Host \" HWND: "\\\  
if (\\ -ne [IntPtr]::Zero) { 
    [DllImport(\" "gdi32.dll\)] public static extern IntPtr CreateCompatibleDC(IntPtr h); 
    [DllImport(\" "user32.dll\)] public static extern bool PrintWindow(IntPtr h,IntPtr d,uint f); 
    [DllImport(\" "gdi32.dll\)] public static extern IntPtr CreateCompatibleBitmap(IntPtr h,int w,int HH); 
    [DllImport(\" "user32.dll\)] public static extern IntPtr GetDC(IntPtr h); 
  \\ = New-Object W+RECT  
  \\ = [System.Drawing.Image]::FromHbitmap(\\)  
  \\ = 'C:\\Users\\yao\\Documents\\Ai美妆\\wechat_devtools_screen1.png' 
  \\.Save(\\, [System.Drawing.Imaging.ImageFormat]::Png)  
  Write-Host \" Saved: "\\\ 
  \\ = [W]::CreateCompatibleDC(\\)  
  \\ = [W]::CreateCompatibleBitmap(\\, \\, \\) 
  \\.Dispose()  
} 
  \\ = \\.Right - \\.Left  
  Write-Host \" Size: \\ x "\\\  
  \\ = [W]::GetDC(\\) 
