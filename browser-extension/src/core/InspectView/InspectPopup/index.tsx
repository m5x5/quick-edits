import React from "react";
import InspectPopupContainer from "./InspectPopupContainer";
import useSelectedTarget from "../hooks/useSelectedTarget";

export default function InspectPopup({
	children,
	targetSelectionActive,
	tagName,
	...props
}: {
	targetSelectionActive: boolean;
	tagName: string;
	children: React.ReactNode;
	setShowSelectBox: (param: boolean) => void;
	showSelectBox: boolean;
}) {
	const [showArrowControls, setShowArrowControls] = React.useState(false);

	React.useEffect(() => {
		if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
			chrome.storage.local.get(['showArrowControls']).then(data => {
				setShowArrowControls(data.showArrowControls ?? true);
			}).catch(error => {
				console.error('Error accessing chrome.storage.local:', error);
				setShowArrowControls(true); // Fallback to default value
			});
		} else {
			setShowArrowControls(true); // Default value when chrome.storage is not available
		}
	}, []);
	const { left, up, down, right, ref } = useSelectedTarget();
	const handleRefresh = () => {
		chrome.runtime.sendMessage(
			{ action: "reload_extension" },
			(response) => {
				console.debug("reload response", response);
				window.location.reload();
			},
		);
	};

	return (
		<InspectPopupContainer targetSelectionActive={targetSelectionActive}>
			<div className="">
				<div className="border-b border-[#3c4043] flex justify-between items-center">
					<span className="dark:text-blue-200 text-blue-500 font-mono text-[13px] p-1 pl-2">{tagName?.toLowerCase()}</span>

					<div className="outline flex items-center justify-between bg-white dark:bg-[#202124] text-black dark:text-white">
						<button
							type="button"
							onClick={handleRefresh}
							className="outline transition-colors dark:hover:bg-[#292a2d] p-1"
							title="Refresh extension"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M10 18c-1.65 0-3.062-.587-4.238-1.762C4.587 15.062 4 13.65 4 12c0-1.65.587-3.062 1.762-4.238C6.938 6.587 8.35 6 10 6v2c-1.117 0-2.067.392-2.85 1.175C6.367 9.958 5.975 10.908 5.975 12c0 1.117.392 2.067 1.175 2.85.783.783 1.733 1.175 2.85 1.175s2.067-.392 2.85-1.175c.783-.783 1.175-1.733 1.175-2.85h2c0 1.65-.587 3.062-1.762 4.238C13.062 17.413 11.65 18 10 18zm4-8V7H11V5h5v5h-2z"
									fill="currentColor"
								/>
							</svg>
						</button>
						{showArrowControls && (
							<div className="flex gap-1 items-center">
								<button type="button" onClick={left} ref={ref} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<title>Left</title>
										<path d="M10 15L5 10L10 5L11.062 6.062L7.125 10L11.062 13.938L10 15Z" fill="black" />
										<circle cx="12.5" cy="10.125" r="1.25" fill="black" />
									</svg>
								</button>
								<button type="button" onClick={up} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
									<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<title>Out</title>
										<path d="M10 18a2.411 2.411 0 0 1-1.771-.729A2.411 2.411 0 0 1 7.5 15.5c0-.695.243-1.285.729-1.771A2.411 2.411 0 0 1 10 13c.695 0 1.285.243 1.771.729s.729 1.076.729 1.771c0 .695-.243 1.285-.729 1.771A2.411 2.411 0 0 1 10 18Zm-.75-6.5V4.875L7.062 7.062 6 6l4-4 4 4-1.062 1.062-2.188-2.187V11.5h-1.5Z" fill="#000" />
									</svg>
								</button>
								<button type="button" onClick={down} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
									<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<title>In</title>
										<path d="M10 18a2.411 2.411 0 0 1-1.771-.729A2.411 2.411 0 0 1 7.5 15.5c0-.695.243-1.285.729-1.771A2.411 2.411 0 0 1 10 13c.695 0 1.285.243 1.771.729s.729 1.076.729 1.771c0 .695-.243 1.285-.729 1.771A2.411 2.411 0 0 1 10 18Zm0-6.5-4-4 1.062-1.062L9.25 8.625V2h1.5v6.625l2.188-2.187L14 7.5l-4 4Z" fill="#000" />
									</svg>
								</button>
								<button type="button" onClick={right} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<title>Right</title>
										<path d="M7.99999 15L6.93799 13.938L10.875 10L6.93799 6.062L7.99999 5L13 10L7.99999 15Z" fill="black" />
									</svg>
								</button>
							</div>
						)}
						<div className="flex gap-1 items-center">
							<button onClick={() => { props.setShowSelectBox(!props.showSelectBox); }} className="dark:hover:bg-[#292a2d] p-1 rounded-sm transition-colors text-sm">
								Toggle Select box
							</button>
						</div>
					</div>
				</div>
				<div className="p-3">{children}</div>
			</div>
		</InspectPopupContainer>
	);
}
