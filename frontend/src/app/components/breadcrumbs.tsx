import { usePathname } from "next/navigation";

export default function BreadCrumbs(): React.JSX.Element {
  const path = usePathname()
  const url = path.substring(1).split("/");

  return (
    <nav>
      <ul className="flex">
        {url.map((u, idx) => {
          const href = "/" + url.slice(0, idx + 1).join("/");
          return (
            <li key={idx}>
              <a href={href} className="">
                /{u}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
