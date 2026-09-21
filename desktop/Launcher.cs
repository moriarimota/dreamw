using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace WitchLifeDesktop
{
    internal static class Program
    {
        internal const int Port = 18765;
        internal const string BaseUrl = "http://127.0.0.1:18765";
        internal static readonly string Root = Path.GetFullPath(AppDomain.CurrentDomain.BaseDirectory);
        internal static readonly string DataRoot = Path.Combine(Root, "user-data");
        internal static readonly string RootId = Fingerprint(Root.ToUpperInvariant());
        private static bool headless;

        [STAThread]
        private static int Main(string[] args)
        {
            headless = Array.IndexOf(args, "--headless") >= 0;
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            try
            {
                if (!File.Exists(Path.Combine(Root, "game", "index.html")))
                    throw new IOException("没有找到 game\\index.html。请保留整个游戏文件夹，再运行启动程序。");
                Directory.CreateDirectory(DataRoot);
                bool isNew;
                using (var instance = new Mutex(true, "Local\\WitchLife_" + RootId, out isNew))
                {
                    if (!isNew)
                    {
                        bool ready = false;
                        for (int i = 0; i < 15 && !ready; i++)
                        {
                            ready = IsOurServer();
                            if (!ready) Thread.Sleep(200);
                        }
                        if (!ready) throw new IOException("游戏启动程序已经打开，但服务暂时没有响应。请从托盘退出后重试。");
                        if (!headless) OpenGame();
                        return 0;
                    }
                    try
                    {
                        using (var server = new LocalServer(Path.Combine(Root, "game"), DataRoot))
                        {
                            try { server.Start(); }
                            catch (SocketException)
                            {
                                if (IsOurServer())
                                {
                                    if (!headless) OpenGame();
                                    return 0;
                                }
                                throw new IOException("本机端口 18765 正被其他程序使用。没有关闭任何其他程序，请稍后重试。");
                            }
                            if (headless) new ManualResetEvent(false).WaitOne();
                            else
                            {
                                using (var tray = new GameTray())
                                {
                                    OpenGame();
                                    Application.Run(tray);
                                }
                            }
                        }
                    }
                    finally { instance.ReleaseMutex(); }
                }
                return 0;
            }
            catch (Exception ex)
            {
                Log(ex);
                if (!headless) MessageBox.Show(ex.Message, "那边的小日子", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return 1;
            }
        }

        private static string Fingerprint(string text)
        {
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(text))).Replace("-", "").Substring(0, 24);
        }

        private static bool IsOurServer()
        {
            try
            {
                using (var client = new TcpClient())
                {
                    client.ReceiveTimeout = 800;
                    client.SendTimeout = 800;
                    client.Connect(IPAddress.Loopback, Port);
                    using (var stream = client.GetStream())
                    using (var memory = new MemoryStream())
                    {
                        byte[] query = Encoding.ASCII.GetBytes("GET /__health HTTP/1.1\r\nHost: 127.0.0.1:" + Port + "\r\nConnection: close\r\n\r\n");
                        stream.Write(query, 0, query.Length);
                        var buffer = new byte[2048];
                        int count;
                        while ((count = stream.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            memory.Write(buffer, 0, count);
                            if (memory.Length > 8192) return false;
                        }
                        string response = Encoding.UTF8.GetString(memory.ToArray());
                        int bodyStart = response.IndexOf("\r\n\r\n", StringComparison.Ordinal);
                        if (bodyStart < 0 || !response.StartsWith("HTTP/1.1 200 ")) return false;
                        var data = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(response.Substring(bodyStart + 4));
                        return data != null && Convert.ToString(data["app"]) == "witchlife" &&
                            Convert.ToInt32(data["version"]) == 2 && Convert.ToString(data["rootId"]) == RootId;
                    }
                }
            }
            catch { return false; }
        }

        internal static void OpenGame()
        {
            var candidates = new List<string>();
            foreach (var folder in new[] { Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) })
            {
                candidates.Add(Path.Combine(folder, "Microsoft", "Edge", "Application", "msedge.exe"));
                candidates.Add(Path.Combine(folder, "Google", "Chrome", "Application", "chrome.exe"));
            }
            foreach (var browser in candidates)
            {
                if (!File.Exists(browser)) continue;
                string profile = Path.Combine(DataRoot, "browser");
                string cache = Path.Combine(DataRoot, "browser-cache");
                Directory.CreateDirectory(profile);
                Directory.CreateDirectory(cache);
                Process.Start(new ProcessStartInfo(browser,
                    "--app=" + BaseUrl + "/ --user-data-dir=\"" + profile + "\" --disk-cache-dir=\"" + cache +
                    "\" --no-first-run --no-default-browser-check --disable-background-mode")
                    { UseShellExecute = false, CreateNoWindow = true });
                return;
            }
            MessageBox.Show("未找到 Edge 或 Chrome，将使用默认浏览器打开。游戏文件和桌面存档在游戏目录中；默认浏览器的缓存仍由它自己的设置决定，可能位于 C 盘。",
                "那边的小日子", MessageBoxButtons.OK, MessageBoxIcon.Information);
            Process.Start(new ProcessStartInfo(BaseUrl + "/") { UseShellExecute = true });
        }

        internal static void Log(Exception ex)
        {
            try
            {
                Directory.CreateDirectory(DataRoot);
                File.AppendAllText(Path.Combine(DataRoot, "launcher.log"), DateTime.Now.ToString("s") + " " + ex + Environment.NewLine, Encoding.UTF8);
            }
            catch { }
        }
    }

    internal sealed class GameTray : ApplicationContext
    {
        private readonly NotifyIcon icon;
        internal GameTray()
        {
            var menu = new ContextMenuStrip();
            menu.Items.Add("打开那边的小日子", null, delegate { TryOpen(); });
            menu.Items.Add("退出游戏服务", null, delegate { ExitThread(); });
            icon = new NotifyIcon { Icon = SystemIcons.Application, Text = "那边的小日子 · 本机游戏服务", ContextMenuStrip = menu, Visible = true };
            icon.DoubleClick += delegate { TryOpen(); };
            icon.ShowBalloonTip(4000, "那边的小日子", "关闭窗口后可从这里重新打开；右键选择“退出游戏服务”可完全退出。", ToolTipIcon.Info);
        }
        private static void TryOpen()
        {
            try { Program.OpenGame(); }
            catch (Exception ex) { Program.Log(ex); MessageBox.Show(ex.Message, "那边的小日子"); }
        }
        protected override void Dispose(bool disposing)
        {
            if (disposing) { icon.Visible = false; icon.ContextMenuStrip.Dispose(); icon.Dispose(); }
            base.Dispose(disposing);
        }
    }

    internal sealed class LocalServer : IDisposable
    {
        private const int MaxHeader = 16384;
        private const int MaxBody = 2 * 1024 * 1024;
        private readonly string gameRoot;
        private readonly string dataRoot;
        private readonly object saveLock = new object();
        private readonly Semaphore slots = new Semaphore(24, 24);
        private TcpListener listener;
        private volatile bool stopping;
        private static readonly UTF8Encoding StrictUtf8 = new UTF8Encoding(false, true);

        internal LocalServer(string game, string data)
        {
            gameRoot = Path.GetFullPath(game).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            dataRoot = data;
        }
        internal void Start()
        {
            listener = new TcpListener(IPAddress.Loopback, Program.Port);
            listener.Server.ExclusiveAddressUse = true;
            listener.Start(24);
            new Thread(AcceptLoop) { IsBackground = true, Name = "WitchLife loopback server" }.Start();
        }
        private void AcceptLoop()
        {
            while (!stopping)
            {
                try
                {
                    var client = listener.AcceptTcpClient();
                    if (!slots.WaitOne(0)) { client.Close(); continue; }
                    ThreadPool.QueueUserWorkItem(delegate
                    {
                        try { Serve(client); }
                        catch (Exception ex) { if (!(ex is IOException) && !(ex is SocketException)) Program.Log(ex); }
                        finally { client.Close(); slots.Release(); }
                    });
                }
                catch (SocketException) { if (!stopping) Thread.Sleep(50); }
                catch (ObjectDisposedException) { break; }
            }
        }
        private void Serve(TcpClient client)
        {
            client.ReceiveTimeout = 5000;
            client.SendTimeout = 5000;
            using (var stream = client.GetStream())
            {
                Request request = null;
                try
                {
                    request = ReadRequest(stream);
                    if (request == null) return;
                    string host;
                    if (!request.Headers.TryGetValue("host", out host) || host != "127.0.0.1:" + Program.Port)
                        throw new HttpError(403, "invalid_host");
                    if (request.Method != "GET" && request.Method != "HEAD" && request.Method != "PUT")
                        throw new HttpError(405, "method_not_allowed");
                    string origin;
                    if (request.Headers.TryGetValue("origin", out origin) && origin != Program.BaseUrl)
                        throw new HttpError(403, "invalid_origin");
                    string fetchSite;
                    if (request.Headers.TryGetValue("sec-fetch-site", out fetchSite) && fetchSite == "cross-site")
                        throw new HttpError(403, "cross_site_request");
                    string rawPath = request.Target.Split('?')[0];
                    if (rawPath.Length == 0 || rawPath[0] != '/' || rawPath.StartsWith("//"))
                        throw new HttpError(400, "invalid_path");
                    string path;
                    try { path = Uri.UnescapeDataString(rawPath); }
                    catch { throw new HttpError(400, "invalid_path"); }
                    if (path.IndexOfAny(new[] { '\\', ':', '\0', '#', '%' }) >= 0)
                        throw new HttpError(403, "invalid_path");
                    foreach (string part in path.Split('/'))
                        if (part == "." || part == ".." || part.StartsWith(".") || part.EndsWith(" ") || part.EndsWith("."))
                            throw new HttpError(403, "invalid_path");
                    if (path == "/__health")
                    {
                        if (request.Method != "GET") throw new HttpError(405, "method_not_allowed");
                        Json(stream, 200, "{\"app\":\"witchlife\",\"version\":2,\"rootId\":\"" + Program.RootId + "\"}");
                    }
                    else if (path == "/api/state") HandleState(stream, request);
                    else
                    {
                        if (request.Method != "GET" && request.Method != "HEAD") throw new HttpError(405, "method_not_allowed");
                        if (path == "/") path = "/index.html";
                        var file = Path.GetFullPath(Path.Combine(gameRoot, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
                        if (!file.StartsWith(gameRoot, StringComparison.OrdinalIgnoreCase)) throw new HttpError(403, "invalid_path");
                        // Do not expose source scripts, logs, repository internals or junction targets.
                        var ext = Path.GetExtension(file).ToLowerInvariant();
                        string mime = Mime(ext);
                        if (mime == null) throw new HttpError(404, "not_found");
                        RejectReparsePoints(file);
                        if (!File.Exists(file)) throw new HttpError(404, "not_found");
                        byte[] bytes = File.ReadAllBytes(file);
                        Reply(stream, 200, mime, bytes, request.Method == "HEAD");
                    }
                }
                catch (HttpError ex)
                {
                    // Consume bounded, already-declared bodies before closing the socket so
                    // Windows does not reset the connection and discard the error response.
                    DiscardRemainingBody(stream, request);
                    Json(stream, ex.Status, "{\"error\":\"" + ex.Message + "\"}");
                }
                catch (IOException) { throw; }
                catch (Exception ex)
                {
                    Program.Log(ex);
                    Json(stream, 500, "{\"error\":\"internal_error\"}");
                }
            }
        }
        private void RejectReparsePoints(string file)
        {
            string current = gameRoot.TrimEnd(Path.DirectorySeparatorChar);
            if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw new HttpError(403, "invalid_path");
            string relative = file.Substring(gameRoot.Length);
            foreach (string part in relative.Split(Path.DirectorySeparatorChar))
            {
                current = Path.Combine(current, part);
                if (!File.Exists(current) && !Directory.Exists(current)) return;
                if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw new HttpError(403, "invalid_path");
            }
        }
        private void HandleState(NetworkStream stream, Request request)
        {
            string file = Path.Combine(dataRoot, "state.json");
            if (request.Method == "GET")
            {
                lock (saveLock)
                {
                    if (!File.Exists(file)) throw new HttpError(404, "no_save");
                    Reply(stream, 200, "application/json; charset=utf-8", File.ReadAllBytes(file), false);
                }
                return;
            }
            if (request.Method != "PUT") throw new HttpError(405, "method_not_allowed");
            string origin;
            if (!request.Headers.TryGetValue("origin", out origin) || origin != Program.BaseUrl)
                throw new HttpError(403, "invalid_origin");
            string contentType;
            if (!request.Headers.TryGetValue("content-type", out contentType) ||
                contentType.Split(';')[0].Trim().ToLowerInvariant() != "application/json")
                throw new HttpError(415, "json_required");
            int length;
            string contentLength;
            if (!request.Headers.TryGetValue("content-length", out contentLength) || !int.TryParse(contentLength, out length) || length < 1)
                throw new HttpError(411, "content_length_required");
            if (length > MaxBody) throw new HttpError(413, "save_too_large");
            var bytes = new byte[length];
            for (int received = 0; received < length; )
            {
                int count = stream.Read(bytes, received, length - received);
                if (count <= 0) throw new HttpError(400, "incomplete_body");
                received += count;
                request.BodyRead += count;
            }
            try
            {
                string json = StrictUtf8.GetString(bytes);
                var validator = new JavaScriptSerializer { MaxJsonLength = MaxBody, RecursionLimit = 100 };
                if (!(validator.DeserializeObject(json) is Dictionary<string, object>)) throw new FormatException();
            }
            catch { throw new HttpError(400, "invalid_json_object"); }
            lock (saveLock)
            {
                string temporary = Path.Combine(dataRoot, "state.pending.json");
                using (var writer = new FileStream(temporary, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    writer.Write(bytes, 0, bytes.Length);
                    writer.Flush(true);
                }
                if (File.Exists(file)) File.Replace(temporary, file, Path.Combine(dataRoot, "state.previous.json"), true);
                else File.Move(temporary, file);
            }
            Json(stream, 200, "{\"ok\":true}");
        }
        private static void DiscardRemainingBody(NetworkStream stream, Request request)
        {
            if (request == null) return;
            string raw;
            int length;
            if (!request.Headers.TryGetValue("content-length", out raw) || !int.TryParse(raw, out length) || length < 0 || length > MaxBody) return;
            var buffer = new byte[8192];
            while (request.BodyRead < length)
            {
                int received = stream.Read(buffer, 0, Math.Min(buffer.Length, length - request.BodyRead));
                if (received <= 0) return;
                request.BodyRead += received;
            }
        }
        private static Request ReadRequest(NetworkStream stream)
        {
            var bytes = new List<byte>();
            while (bytes.Count < MaxHeader)
            {
                int b = stream.ReadByte();
                if (b < 0) return null;
                bytes.Add((byte)b);
                int n = bytes.Count;
                if (n >= 4 && bytes[n - 4] == 13 && bytes[n - 3] == 10 && bytes[n - 2] == 13 && bytes[n - 1] == 10) break;
            }
            if (bytes.Count >= MaxHeader) throw new HttpError(431, "headers_too_large");
            string[] lines = Encoding.ASCII.GetString(bytes.ToArray()).Split(new[] { "\r\n" }, StringSplitOptions.None);
            string[] first = lines[0].Split(' ');
            if (first.Length != 3 || (first[2] != "HTTP/1.1" && first[2] != "HTTP/1.0")) throw new HttpError(400, "invalid_request");
            var request = new Request { Method = first[0], Target = first[1] };
            for (int i = 1; i < lines.Length && lines[i].Length > 0; i++)
            {
                int colon = lines[i].IndexOf(':');
                if (colon < 1 || char.IsWhiteSpace(lines[i][0])) throw new HttpError(400, "invalid_header");
                string name = lines[i].Substring(0, colon).ToLowerInvariant();
                if (request.Headers.ContainsKey(name)) throw new HttpError(400, "duplicate_header");
                request.Headers.Add(name, lines[i].Substring(colon + 1).Trim());
            }
            if (request.Headers.ContainsKey("transfer-encoding")) throw new HttpError(400, "transfer_encoding_not_supported");
            if (request.Headers.ContainsKey("content-encoding")) throw new HttpError(415, "content_encoding_not_supported");
            if (request.Headers.ContainsKey("expect")) throw new HttpError(417, "expectation_failed");
            return request;
        }
        private static string Mime(string ext)
        {
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": case ".mjs": return "text/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".webmanifest": return "application/manifest+json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg": case ".jpeg": return "image/jpeg";
                case ".webp": return "image/webp";
                case ".gif": return "image/gif";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".mp3": return "audio/mpeg";
                case ".ogg": return "audio/ogg";
                case ".wav": return "audio/wav";
                case ".mp4": return "video/mp4";
                case ".wasm": return "application/wasm";
                default: return null;
            }
        }
        private static void Json(NetworkStream stream, int status, string value)
        { Reply(stream, status, "application/json; charset=utf-8", Encoding.UTF8.GetBytes(value), false); }
        private static void Reply(NetworkStream stream, int status, string mime, byte[] body, bool head)
        {
            string reason = status == 200 ? "OK" : status == 404 ? "Not Found" : status == 403 ? "Forbidden" : status == 500 ? "Internal Server Error" : "Request Rejected";
            string headers = "HTTP/1.1 " + status + " " + reason + "\r\nContent-Type: " + mime +
                "\r\nContent-Length: " + body.Length + "\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: same-origin\r\nX-Frame-Options: DENY\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (!head) stream.Write(body, 0, body.Length);
        }
        public void Dispose()
        {
            stopping = true;
            if (listener != null) listener.Stop();
            // In-flight requests finish against this process; no new requests are accepted.
        }
        private sealed class Request
        {
            internal string Method;
            internal string Target;
            internal int BodyRead;
            internal readonly Dictionary<string, string> Headers = new Dictionary<string, string>();
        }
        private sealed class HttpError : Exception
        {
            internal readonly int Status;
            internal HttpError(int status, string message) : base(message) { Status = status; }
        }
    }
}
