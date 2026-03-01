"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost">主题</Button>;
  }

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <Button variant="ghost" onClick={() => setTheme(nextTheme)}>
      {theme === "dark" ? "切换亮色" : "切换暗色"}
    </Button>
  );
}
