using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using RecordingAudioAsp.Net.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace RecordingAudioAsp.Net.Controllers
{
	public class HomeController : Controller
	{
		private readonly ILogger<HomeController> _logger;
		private readonly IWebHostEnvironment _appEnvironment;

		public HomeController(ILogger<HomeController> logger, IWebHostEnvironment hostingEnvironment)
		{
			_logger = logger;
			_appEnvironment = hostingEnvironment;
		}

		public IActionResult Index()
		{
			return View();
		}

		public IActionResult RecorderJS()
		{
			return View();
		}

		public IActionResult AudioList()
		{
			var uploadFolder = Path.Combine(_appEnvironment.WebRootPath, "audio");
			string[] audioFiles = ConcatUrls(
				Directory.GetFiles(uploadFolder, "*.mp3"),
				Directory.GetFiles(uploadFolder, "*.wav"),
				Directory.GetFiles(uploadFolder, "*.ogg"));
			ViewBag.AudioFiles = audioFiles;
			return View();
		}

		[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
		public IActionResult Error()
		{
			return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
		}

		[HttpPost]
		[Route("api/UploadAudio")]
		[ProducesResponseType(200)]
		[ProducesResponseType(400)]
		public async Task<IActionResult> UploadAudio(IFormFile audio_data)
		{
			if (!ModelState.IsValid || audio_data == null || audio_data.Length == 0)
				return BadRequest("Invalid uploaded file");
			if (audio_data.ContentType != "audio/wav" && audio_data.ContentType != "audio/mpeg" && audio_data.ContentType != "audio/ogg")
				return BadRequest("Invalid audio file type");
			var uploadFolder = Path.Combine(_appEnvironment.WebRootPath, "audio");
			var filePath = Path.Combine(uploadFolder, audio_data.FileName);
			if (System.IO.File.Exists(filePath))
				return Ok("Duplicated uploaded file");
			try
			{
				using FileStream filestream = new(filePath, FileMode.Create);
				await audio_data.CopyToAsync(filestream);
			}
			catch (Exception e)
			{
				return BadRequest(e.Message);
			}
			return Ok("File uploaded successfully");
		}

		public string[] ConcatUrls(params string[][] arrays)
		{
			List<string> result = new();
			foreach (var arr in arrays)
			{
				result.AddRange(arr.ToList());
			}
			return result.Select(p => ConvertRelativePath(p)).ToArray();
		}

		public string ConvertRelativePath(string absolutePath)
		{
			return absolutePath.Replace(_appEnvironment.WebRootPath, "").Replace(@"\", "/");
		}
	}
}
