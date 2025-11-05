import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type CustomAvatarProps = {
  role: "user" | "assistant";
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
};

function CustomAvatar({ role, src, alt, size = "md" }: CustomAvatarProps) {
  const isUser = role === "user";

  // Kích thước theo size
  const sizeClasses =
    size === "sm"
      ? "w-6 h-6 text-xs"
      : size === "lg"
      ? "w-12 h-12 text-lg"
      : "w-8 h-8 text-sm"; // md mặc định

  return (
    <Avatar
      className={`${sizeClasses} rounded-full overflow-hidden border flex items-center justify-center font-semibold
        ${
          isUser
            ? "bg-blue-500 text-white border-blue-400"
            : "bg-linear-to-br from-purple-500 to-pink-500 text-white border-zinc-700 dark:border-white "
        }`}
    >
      <AvatarImage
        src={isUser ? src : "/src/assets/logo/logo-final.png"}
        alt={alt || role}
      />
      <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
    </Avatar>
  );
}

export default CustomAvatar;
