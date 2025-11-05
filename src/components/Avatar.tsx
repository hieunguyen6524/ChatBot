type AvatarProps = {
  role: "user" | "assistant";
};

function Avatar({ role }: AvatarProps) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
        role === "user"
          ? "bg-blue-500 text-white"
          : "bg-linear-to-br from-purple-500 to-pink-500 text-white"
      }`}
    >
      {role === "user" ? "U" : "AI"}
    </div>
  );
}

export default Avatar;
