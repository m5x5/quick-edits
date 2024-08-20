import React from "react";

function Button(props: JSX.IntrinsicElements["button"]) {
	return (
		<button
			type="button"
			{...props}
			className={`text-xs py-1 bg-[#0957d0] dark:bg-[#a8c7fa] text-white dark:text-[#072e6f] font-[Helvetica] rounded-full px-3 ${props.className}`}
		>
			{props.children}
		</button>
	);
}

export default Button;
