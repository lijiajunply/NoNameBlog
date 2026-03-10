"use client";

type LinkCardProps = {
  url: string;
  description: string;
  title: string;
  icon: string;
};

export function LinkCard({ url, description, title, icon }: LinkCardProps) {
  return (
    <div className={"flex justify-center"}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline! flex items-center justify-between p-4 dark:bg-gray-800 bg-gray-100 rounded-2xl"
        style={{ maxWidth: "90%", width: "20rem" }}
      >
        <div className="flex flex-col space-y-1 overflow-hidden">
          <div className="font-bold truncate">{title}</div>
          <div className="dark:text-gray-400 text-gray-600 text-sm truncate">
            {description}
          </div>
        </div>

        <img
          src={icon}
          alt="thumbnail"
          className="max-w-20 h-12 rounded-xl object-cover m-0!"
        />
      </a>
    </div>
  );
}
