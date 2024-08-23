import fs from "node:fs";
import archiver from "archiver";

// Create a file to stream the ZIP archive to
const output = fs.createWriteStream("dist.zip");
const archive = archiver("zip", {
	zlib: { level: 9 }, // Sets the compression level
});

// Listen for all archive data to be written
output.on("close", () => {
	console.log(`${archive.pointer()} total bytes`);
	console.log(
		"ZIP archive has been finalized and the output file descriptor has closed.",
	);
});

// Good practice to catch warnings (e.g., stat failures and other non-blocking errors)
archive.on("warning", (err) => {
	if (err.code === "ENOENT") {
		console.warn(err);
	} else {
		throw err;
	}
});

// Catch errors
archive.on("error", (err) => {
	throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Optionally, append directories as well
archive.directory("dist", "dist", { name: "dist" });

// Finalize the archive (i.e., write all the data and end the stream)
await archive.finalize();
