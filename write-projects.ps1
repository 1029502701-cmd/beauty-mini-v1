
$baseDir = "."

# Create app.tsx using here-string and Out-File
$appContent = @"
import { useState } from "react";

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>AI 美妆小程序 V1</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
};

export default App;
"@
Out-File -FilePath "$baseDir/beauty-mini-v1/src/app.tsx" -InputObject $appConfig -Encoding UTF8

# Create index.tsx for entry point
$indexContent = @"
import { useState } from "react";
import "./index.css";

const Index = () => {
  return (
    <div className="index">
      <h2>Welcome to AI Beauty Mini</h2>
      <p>This is the home page.</p>
    </div>
  );
};

export default Index;
"@
Out-File -FilePath "$baseDir/beauty-mini-v1/src/pages/home/index.tsx" -InputObject $indexContent -Encoding UTF8

# Create component for demo
$componentContent = @"
import React from "react";

interface BeautyCardProps {
  title: string;
  description: string;
  imageUrl?: string;
}

const BeautyCard = ({ title, description, imageUrl }: BeautyCardProps) => {
  return (
    <div className="beauty-card">
      {imageUrl && <img src={imageUrl} alt={title} />}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default BeautyCard;
"@
Out-File -FilePath "$baseDir/beauty-mini-v1/src/components/BeautyCard.tsx" -InputObject $componentContent -Encoding UTF8

Write-Host "Project files created successfully." -ForegroundColor Green

