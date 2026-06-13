import sys
from PIL import Image

def remove_background(image_path, output_path, target_color="white", tolerance=240):
    """
    Loads an image, performs a flood-fill from the corners to find background pixels,
    and sets them to fully transparent.
    """
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    queue = []
    
    # Add four corners as seeds for the flood fill
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    for x, y in corners:
        r, g, b, a = pixels[x, y]
        if is_background_color(r, g, b, target_color, tolerance):
            queue.append((x, y))
            visited.add((x, y))
            
    # Breadth-first search flood fill
    while queue:
        x, y = queue.pop(0)
        # Set to transparent
        pixels[x, y] = (0, 0, 0, 0)
        
        # Check neighbors
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                r, g, b, a = pixels[nx, ny]
                if is_background_color(r, g, b, target_color, tolerance):
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    img.save(output_path)
    print(f"Processed: {image_path} -> {output_path} (Background removed)")

def is_background_color(r, g, b, target, tolerance):
    if target == "white":
        return r >= tolerance and g >= tolerance and b >= tolerance
    elif target == "black":
        return r <= tolerance and g <= tolerance and b <= tolerance
    return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 remove_background.py <input_path> <output_path> [white/black] [tolerance]")
        sys.exit(1)
        
    in_path = sys.argv[1]
    out_path = sys.argv[2]
    bg_color = sys.argv[3] if len(sys.argv) > 3 else "white"
    tol = int(sys.argv[4]) if len(sys.argv) > 4 else (240 if bg_color == "white" else 15)
    
    remove_background(in_path, out_path, bg_color, tol)
