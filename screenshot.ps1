Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class W {
    [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c,string n);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h,IntPtr d,uint f);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h,out RECT r);
    [DllImport("user32.dll")] public static extern IntPtr GetDC(IntPtr h);
    [DllImport("gdi32.dll")] public static extern IntPtr CreateCompatibleDC(IntPtr h);
    [DllImport("gdi32.dll")] public static extern IntPtr CreateCompatibleBitmap(IntPtr h,int w,int HH);
    [DllImport("gdi32.dll")] public static extern IntPtr SelectObject(IntPtr h,IntPtr o);
    [DllImport("gdi32.dll")] public static extern bool DeleteObject(IntPtr o);
    [DllImport("gdi32.dll")] public static extern bool DeleteDC(IntPtr h);
    [DllImport("user32.dll")] public static extern int ReleaseDC(IntPtr h,IntPtr d);
    [StructLayout(LayoutKind.Sequential)] public struct RECT{public int Left;public int Top;public int Right;public int Bottom;}
}
"@
$hwnd = [W]::FindWindow($null, 'miniprogram-1')
Write-Host "HWND: $hwnd"
if ($hwnd -ne [IntPtr]::Zero) {
  [W]::SetForegroundWindow($hwnd) | Out-Null
  Start-Sleep -Milliseconds 800
  $rect = New-Object W+RECT
  [W]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  Write-Host "Size: $width x $height"
  $hWndDC = [W]::GetDC($hwnd)
  $memDC = [W]::CreateCompatibleDC($hWndDC)
  $hBitmap = [W]::CreateCompatibleBitmap($hWndDC, $width, $height)
  $hOld = [W]::SelectObject($memDC, $hBitmap)
  [W]::PrintWindow($hwnd, $memDC, 0) | Out-Null
  $bitmap = [System.Drawing.Image]::FromHbitmap($hBitmap)
  $outPath = 'C:\Users\yao\Documents\Ai美妆\wechat_devtools_screen1.png'
  $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Saved: $outPath"
  [W]::SelectObject($memDC, $hOld) | Out-Null
  [W]::DeleteObject($hBitmap) | Out-Null
  [W]::DeleteDC($memDC) | Out-Null
  [W]::ReleaseDC($hwnd, $hWndDC) | Out-Null
  $bitmap.Dispose()
}
