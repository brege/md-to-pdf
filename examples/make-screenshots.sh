#!/bin/bash

set -e
cd "$(dirname "$0")" || exit 1

# --- Configuration for PDF to PNG Conversion ---
# Set to true to use pdftoppm for initial PDF rasterization (often crisper text/lines).
USE_PDFTOPPM=true 

# Set to true to keep generated PDF files in the output directory for debugging.
SAVE_PDFS_FOR_DEBUGGING=false 

# --- Check for required tools ---
command -v magick >/dev/null 2>&1 || { 
  echo >&2 "I require imagemagick but it's not installed.  Aborting.";
  echo "debian:   sudo apt-get install imagemagick";
  echo "fedora:   sudo dnf install ImageMagick";
exit 1; }

if [ "$USE_PDFTOPPM" = true ]; then
  command -v pdftoppm >/dev/null 2>&1 || {
    echo >&2 "You've chosen to use pdftoppm but it's not installed. Aborting.";
    echo "pdftoppm is part of poppler-utils.";
    echo "debian:   sudo apt-get install poppler-utils";
    echo "fedora:   sudo dnf install poppler-utils";
    exit 1;
  }
fi

mkdir -p ../docs/images/screenshots

# --- Single Page Examples ---
md-to-pdf convert example-recipe.md \
           --plugin recipe \
           --config ./screenshot-config.yaml \
           --filename example-recipe.pdf \
           --outdir ../docs/images/screenshots \
           --no-open

md-to-pdf convert example-cv.md \
           --plugin cv \
           --config ./screenshot-config.yaml \
           --filename example-cv.pdf \
           --outdir ../docs/images/screenshots \
           --no-open

md-to-pdf convert example-cover-letter.md \
           --plugin cover-letter \
           --config ./screenshot-config.yaml \
           --filename example-cover-letter.pdf \
           --outdir ../docs/images/screenshots \
           --no-open

# --- Business Card Examples ---
md-to-pdf convert ../test/assets/example-business-card.md \
             --plugin business-card \
             --config ../test/config.test.yaml \
             --filename example-business-card.pdf \
             --outdir ../docs/images/screenshots \
             --no-open

md-to-pdf convert ./custom_plugin_showcase/advanced-card/advanced-card-example.md \
             --plugin advanced-card \
             --config ./screenshot-config.yaml \
             --filename advanced-business-card.pdf \
             --outdir ../docs/images/screenshots \
             --no-open

# --- Presentation Slide Example ---
echo "d3-histogram-slide"

# Define paths for conditional checks (external plugins)
D3_MD_PATH="../../md-to-pdf-plugins/d3-histogram-slide/d3-histogram-slide.md"
RESTAURANT_MD_PATH="../../md-to-pdf-plugins/restaurant-menu/restaurant-menu-example.md"

if [ -f "$D3_MD_PATH" ]; then
  echo "Generating D3 Histogram Slide..."
  md-to-pdf convert "$D3_MD_PATH" \
            --config ./screenshot-config.yaml \
            --filename d3-histogram-slide.pdf \
            --outdir ../docs/images/screenshots \
            --no-open
else
  echo "Skipping D3 Histogram Slide generation: Markdown file not found at $D3_MD_PATH"
fi

# --- Restaurant Menu Example (Single View) ---
if [ -f "$RESTAURANT_MD_PATH" ]; then
  echo "Generating Restaurant Menu (Single View)..."
  md-to-pdf convert "$RESTAURANT_MD_PATH" \
            --config ./screenshot-config.yaml \
            --filename restaurant-menu.pdf \
            --outdir ../docs/images/screenshots \
            --no-open
else
  echo "Skipping Restaurant Menu generation: Markdown file not found at $RESTAURANT_MD_PATH"
fi

# --- Convert PDFs to PNGs ---
for f in ../docs/images/screenshots/*.pdf; do 
  output_base="../docs/images/screenshots/$(basename "$f" .pdf)"
  output_png="${output_base}.png"
  
  if [ "$USE_PDFTOPPM" = true ]; then
    echo "Converting '$f' to PNG using pdftoppm and magick for background..."
    temp_pdftoppm_output_prefix="/tmp/$(basename "$f" .pdf)" 
    
    # pdftoppm output suffix (e.g., filename-1.png on fedora)
    expected_output_file="${temp_pdftoppm_output_prefix}-1.png" 

    pdftoppm_output=$(pdftoppm -png -r 600 "$f" "${temp_pdftoppm_output_prefix}" 2>&1)
    pdftoppm_exit_status=$?

    if [ "$pdftoppm_exit_status" -ne 0 ]; then
      echo "ERROR: pdftoppm failed for $f. Exit status: $pdftoppm_exit_status"
      echo "pdftoppm output/errors:"
      echo "$pdftoppm_output"
      echo "--------------------------------------------------------"
    elif [ -f "$expected_output_file" ]; then 
      magick "$expected_output_file" \
             -background white -alpha remove -alpha off \
             -quality 92 \
             "$output_png"
      rm "$expected_output_file" 
    else
      echo "WARN: pdftoppm did not produce the expected PNG output (${expected_output_file}) for $f. Check PDF content or pdftoppm output."
    fi
  else # Use magick for PDF conversion if pdftoppm is not enabled
    echo "Converting '$f' to PNG using magick's PDF delegate..."
    magick -density 600 "$f[0]" \
           -background white -alpha remove -alpha off \
           +repage \
           -define pdf:TextAlphaBits=4 -define pdf:GraphicsAlphaBits=4 \
           -quality 92 \
           "$output_png"
  fi
done

# --- Clean up PDFs ---
if [ "$SAVE_PDFS_FOR_DEBUGGING" = false ]; then
  rm ../docs/images/screenshots/example-recipe.pdf
  rm ../docs/images/screenshots/example-cv.pdf
  rm ../docs/images/screenshots/example-cover-letter.pdf
  rm ../docs/images/screenshots/example-business-card.pdf
  rm ../docs/images/screenshots/advanced-business-card.pdf

  if [ -f "$D3_MD_PATH" ]; then
      rm ../docs/images/screenshots/d3-histogram-slide.pdf
  fi

  if [ -f "$RESTAURANT_MD_PATH" ]; then
      rm ../docs/images/screenshots/restaurant-menu.pdf
  fi
fi
