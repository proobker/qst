import Image from "next/image";
import Link from "next/link";
import logoSrc from "../../assets/logo.svg";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
};

const boxClass = {
  sm: "max-h-8 max-w-8",
  md: "max-h-10 max-w-10",
  lg: "max-h-[50px] max-w-[50px]",
} as const;

export function Logo({ size = "md", className, href }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={logoSrc}
        alt="qst"
        width={50}
        height={50}
        className={cn("size-auto shrink-0 object-contain", boxClass[size])}
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
