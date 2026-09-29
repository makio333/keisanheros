using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

class Program {
    static void Main(string[] args) {
        if (args.Length < 2) return;
        string inPath = args[0];
        string outPath = args[1];

        using (Bitmap bmp = new Bitmap(inPath)) {
            int width = bmp.Width;
            int height = bmp.Height;
            bool[,] bgMask = new bool[width, height];
            Queue<Point> q = new Queue<Point>();

            // Enqueue edges
            for (int x = 0; x < width; x++) {
                if (IsBg(bmp.GetPixel(x, 0))) { q.Enqueue(new Point(x, 0)); bgMask[x, 0] = true; }
                if (IsBg(bmp.GetPixel(x, height - 1))) { q.Enqueue(new Point(x, height - 1)); bgMask[x, height - 1] = true; }
            }
            for (int y = 0; y < height; y++) {
                if (IsBg(bmp.GetPixel(0, y))) { q.Enqueue(new Point(0, y)); bgMask[0, y] = true; }
                if (IsBg(bmp.GetPixel(width - 1, y))) { q.Enqueue(new Point(width - 1, y)); bgMask[width - 1, y] = true; }
            }

            int[] dx = {-1, 1, 0, 0};
            int[] dy = {0, 0, -1, 1};

            while (q.Count > 0) {
                Point p = q.Dequeue();
                for (int i = 0; i < 4; i++) {
                    int nx = p.X + dx[i];
                    int ny = p.Y + dy[i];
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && !bgMask[nx, ny]) {
                        if (IsBg(bmp.GetPixel(nx, ny))) {
                            bgMask[nx, ny] = true;
                            q.Enqueue(new Point(nx, ny));
                        }
                    }
                }
            }
            
            // Second pass: remove isolated small non-bg components (noise in background)
            // Anything that is not bgMask, if it's very small, make it bgMask
            bool[,] visited = new bool[width, height];
            for (int x=0; x<width; x++) {
                for (int y=0; y<height; y++) {
                    if (!bgMask[x,y] && !visited[x,y]) {
                        List<Point> comp = new List<Point>();
                        Queue<Point> cq = new Queue<Point>();
                        cq.Enqueue(new Point(x,y));
                        visited[x,y] = true;
                        
                        while(cq.Count > 0) {
                            Point p = cq.Dequeue();
                            comp.Add(p);
                            for(int i=0; i<4; i++) {
                                int nx = p.X+dx[i], ny = p.Y+dy[i];
                                if(nx>=0 && nx<width && ny>=0 && ny<height && !bgMask[nx,ny] && !visited[nx,ny]) {
                                    visited[nx,ny] = true;
                                    cq.Enqueue(new Point(nx,ny));
                                }
                            }
                        }
                        
                        if (comp.Count < 50) { // Tiny speck
                            foreach(var p in comp) bgMask[p.X, p.Y] = true;
                        }
                    }
                }
            }

            // Defringe
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    if (bgMask[x, y]) {
                        bmp.SetPixel(x, y, Color.Transparent);
                    } else {
                        Color c = bmp.GetPixel(x, y);
                        int dist = 5;
                        for(int i=-2; i<=2; i++) {
                            for(int j=-2; j<=2; j++) {
                                int nx = x+i, ny = y+j;
                                if(nx>=0 && nx<width && ny>=0 && ny<height) {
                                    if (bgMask[nx, ny]) {
                                        dist = Math.Min(dist, Math.Max(Math.Abs(i), Math.Abs(j)));
                                    }
                                }
                            }
                        }

                        if (dist <= 2) {
                            int brightness = (c.R + c.G + c.B) / 3;
                            if (brightness > 120) {
                                int alpha = 255 - (brightness - 120) * 255 / 135;
                                alpha = Math.Max(0, Math.Min(255, alpha));
                                int darken = Math.Max(50, alpha); // don't make it pitch black
                                bmp.SetPixel(x, y, Color.FromArgb(alpha, c.R * darken / 255, c.G * darken / 255, c.B * darken / 255));
                            }
                        }
                    }
                }
            }

            bmp.Save(outPath, ImageFormat.Png);
        }
    }

    static bool IsBg(Color c) {
        // High tolerance for white/off-white (JPEG compression artifacts)
        return c.R > 210 && c.G > 210 && c.B > 210;
    }
}
