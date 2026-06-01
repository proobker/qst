import Image from "next/image";
import Link from "next/link";
import logoSrc from "../../assets/logo.svg";
import { cn } from "@/lib/utils";

const LOGO_ASPECT = 281.067 / 251.2;

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
};

const heights = { sm: 28, md: 40, lg: 64 } as const;

export function Logo({ size = "md", className, href }: LogoProps) {
  const height = heights[size];
  const width = Math.round(height * LOGO_ASPECT);

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={logoSrc}
        alt="qst"
        width={width}
        height={height}
        className="h-auto w-auto shrink-0"
        priority={size === "lg"}
        unoptimized
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {content}
      </Link>
    );
  }

  return content;
}
