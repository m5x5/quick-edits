export function Input(props: {
  placeholder: string;
  type: string;
  name?: string;
}) {
  return (
    <input
      placeholder={props.placeholder}
      type={props.type}
      className="border focus-visible:outline focus-visible:outline-2 rounded-md py-2 px-3 min-w-64 placeholder-gray-600"
      aria-label={props.placeholder}
      name={props.name}
    />
  );
}
