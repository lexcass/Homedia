const http 			= require('http');
const fs   			= require('fs');
const Formidable 	= require('formidable');
const ip			= require('ip');

var form_html = fs.readFileSync('form.html');
var success_html = fs.readFileSync('success.html');
var path = __dirname + "/content/";

console.log("DIRNAME = " + __dirname);
console.log("PATH = " + path);

var workingDir = '';

var re_slashDot = /\/[\S\s]+\..+/;
var re_slashNoDot = /\/[\S\s]+/;
var re_dot      = /[\S\s]+\..+/;
var re_noDot    = /[^\.]*/;


function viewFiles(res)
{
	res.writeHead(200);
	fs.readdir(path + workingDir, function(err, files)
	{
		res.write('<style>li { font-size: 1em; padding: 0.75em 0.5em; } button { font-size: 1.25em; padding: 0.25em; }</style>' + 
		'<h1>Server Contents</h1><a href="/upload"><button>Upload File</button></a><ul>');
		
		if (workingDir !== '')
		{
			var lastIndex = workingDir.lastIndexOf('/');
			var prevDir;
			
			if (lastIndex <= 0)
			{
				prevDir = '';
			}
			else
			{
				prevDir = workingDir.substring(0, lastIndex);
			}
			
			console.log("Prev Dir: " + prevDir);
			
			res.write('<a href="../' + prevDir + '"><--</a>');
		}
		
		console.log("Working Dir: " + workingDir);
		
		// List subdirectories...
		files.forEach(function(file)
		{
			if (fs.lstatSync(path + workingDir + '/' + file).isDirectory())
			{
				res.write('<li><a href="' + workingDir + '/' + file + '">[DIR] ' + file + '</a></li>');
			}
		});
		
		// Then list files
		files.forEach(function(file)
		{
			if (!fs.lstatSync(path + workingDir + '/' + file).isDirectory())
			{
				res.write('<li><a href="' + workingDir + '/' + file + '">' + file + '</a></li>');
			}
		});
		
		res.write('</ul>')
		
		res.end();
	});
}


http.createServer(function(req, res)
{
	if (req.url == '/')
	{
		workingDir = '';
		viewFiles(res);
	}
	
	
	// Upload Form
	else if (req.url == '/upload')
	{
		res.writeHead(200);
		res.write(form_html)
		return res.end();
	}
	
	
	// File Upload Success
	else if (req.url == '/file_upload')
	{
		var form = new Formidable.IncomingForm();
		form.parse(req, function(err, fields, files)
		{
			// Remove # from filename
			files.uploadedFile.name = files.uploadedFile.name.replace(/#/g, "");
			
			var oldPath = files.uploadedFile.path;
			var newPath = path + workingDir + '/' + files.uploadedFile.name;
			
			console.log("Stored in " + newPath);
			
			fs.rename(oldPath, newPath, function(err)
			{
				if (err) throw err;
				
				res.write(success_html);
				res.end();
			});
		});
	}
	
	
	// View a file
	else if (re_slashDot.test(req.url))
	{
		var fileToView = req.url.substring(1, req.url.length);
		fileToView = fileToView.replace(/%20/g, " ");
		
		if (fileToView !== 'favicon.ico')
		{
			console.log(fileToView);
			fs.readFile(path + fileToView, 'binary', function(err, bin)
			{
				if (err)
				{
					res.writeHead(500);
					res.write('\nFile not found.\n');
					res.end();
					return;
				}
				else
				{
					res.writeHead(200);
					res.write(bin, 'binary');
					return res.end();
				}
			});
		}
	}
	
	
	// View a subdirectory
	else if (re_slashNoDot.test(req.url))
	{
		workingDir = req.url.substring(1, req.url.length);
		viewFiles(res);
	}
	
	
	// Handle invalid requests
	else
	{
		res.writeHead(500);
		res.write('\nFile not found.\n');
		res.end();
	}
}).listen(8080);

console.log("The server is ready. Visit http://" + ip.address() + ":8080 to view and upload files.");