

var _ = require('underscore');

function printFonts() {

    if (!(font.loadedName in current.fontDict)) {
        current.fontDict[font.loadedName] = {
            "name"           : font.name,
            "loadedName"     : font.loadedName
        }

        // console.error("Current----------------------------------------------------");
        // console.error("current           : " + objToString(current));
        // console.error("Font----------------------------------------------------");
        // console.error("font           : " + objToString(font));
        // console.error("props----------------------------------------------------");
        // console.error("font.name           : " + font.name);
        // console.error("font.loadedName     : " + font.loadedName);
        // // console.error("font.isType3Font    : " + font.isType3Font);
        // // console.error("font.sizes          : " + font.sizes);
        // console.error("font.glyphCache     : " + objToString(font.glyphCache));
        // // console.error("font.isSerifFont    : " + font.isSerifFont);
        // // console.error("font.isSymbolicFont : " + font.isSymbolicFont);
        // // console.error("font.isMonospace    : " + font.isMonospace);
        // // console.error("font.type           : " + font.type);
        // console.error("font.fallbackName   : " + font.fallbackName);
        // console.error("font.differences    : " , font.differences);
        // // // console.error("font.widths         : " , font.widths);
        // // console.error("font.defaultWidth   : " , font.defaultWidth);
        // // console.error("font.composite      : " + font.composite);
        // // console.error("font.wideChars      : " + font.wideChars);
        // console.error("font.cMap           : ", objToString(font.cMap));
        // // console.error("font.ascent         : " + font.ascent);
        // // console.error("font.descent        : " + font.descent);
        // // console.error("font.fontMatrix     : " + font.fontMatrix);
        // // console.error("font.toUnicode      : " , objToString(font.toUnicode));
        // // console.error("font.toFontChar     : " + font.toFontChar);
        // // console.error("font.cidEncoding    : " + font.cidEncoding);
        // // console.error("font.vertical       : " + font.vertical);
        // console.error("font.mimetype       : " + font.mimetype);
        // console.error("font.data           :  ", objToString(font.data));
        // console.error("font.charCodeToGlyphId: " + font.charCodeToGlyphId);
        // console.error("----------------------------------------------------");
    }

}

function objToString(obj, ndeep) {
    if(obj == null){ return String(obj); }
    switch(typeof obj){
    case "string": return '"'+obj+'"';
    case "function": return obj.name || obj.toString();
    case "object":
        var indent = Array(ndeep||1).join('\t'), isArray = Array.isArray(obj);
        return '{['[+isArray] + Object.keys(obj).map(function(key){
            return '\n\t' + indent + key + ': ' + objToString(obj[key], (ndeep||1)+1);
        }).join(',') + '\n' + indent + '}]'[+isArray];
    default: return obj.toString();
    }
};


function override_SVGGraphics_moveText(x, y) {
    // if y stays the same, this is the same line.

    var current = this.current;
    this.current.x = this.current.lineX += x;
    this.current.y = this.current.lineY += y;
    if (y*y>4) { // Arbitrary number to consider as newline
        // new line
        this.current.linegrp = document.createElementNS(NS, 'svg:g');
        current.linegrp.appendChild(current.txtElement);

        this.current.linegrp
    } else {
    }
    current.xcoords = [];
    current.tspan = document.createElementNS(NS, 'svg:tspan');
    current.tspan.setAttributeNS(null, 'font-family', current.fontFamily);
    current.tspan.setAttributeNS(null, 'font-size',
                                 pf(current.fontSize) + 'px');
    current.tspan.setAttributeNS(null, 'y', pf(-current.y));
},

function override_SVGGraphics_showText(glyphs) {

    var current = this.current;
    var font = current.font;
    var fontSize = current.fontSize;

    if (fontSize === 0) {
        return;
    }

    var charSpacing = current.charSpacing;
    var wordSpacing = current.wordSpacing;
    var fontDirection = current.fontDirection;
    var textHScale = current.textHScale * fontDirection;
    var glyphsLength = glyphs.length;
    var vertical = font.vertical;
    var widthAdvanceScale = fontSize * current.fontMatrix[0];

    // printFonts();

    // find entry in glyphCache for glyph
    var gcMap = {};
    _.each(
        _.pairs(font.glyphCache),
        function(e) { gcMap[e[1].unicode] = e[0]; }
    );

    var spellings = [];
    var dists = [];

    var spaceNum = 150;

    if (this.lastEndX) {
        if ((current.x - this.lastEndX) > spaceNum * textHScale * fontSize * 0.001) {
            current.xcoords.push(this.lastEndX);
            current.tspan.textContent += ' ';
        }
    }

    // console.error("processing glyph array ", objToString(glyphs));

    var x = 0, i, ci; // ci = character index
    for (i = ci = 0; i < glyphsLength; ++i, ci=current.xcoords.length) {
        var glyph = glyphs[i];
        if (glyph === null) {
            // word break
            x += fontDirection * wordSpacing;
            continue;
        } else if (isNum(glyph)) {
            if (glyph < -spaceNum) {
                current.xcoords.push(current.x + x * textHScale);
                current.tspan.textContent += ' ';
            }
            x += -glyph * fontSize * 0.001;
            continue;
        }


        var glyphIndex = parseInt(gcMap[glyph.unicode]);
        var diff = font.differences[glyphIndex];
        if (diff) {
            spellings[ci] = diff;
        }

        // TODO should this be minus if text is vertical (like if statement below)?
        current.xcoords.push(current.x + x * textHScale);

        var width = glyph.width;
        //var character = glyph.fontChar;
        var character = glyph.unicode;
        var charWidth = width * widthAdvanceScale + charSpacing * fontDirection;

        var fwidth = font.widths[glyphIndex];
        var fwidthAS = fwidth * widthAdvanceScale + charSpacing * fontDirection;

        x += charWidth;

        // do glyph sub here
        // console.error("  for glyph ", i, " glyphIndex=", glyphIndex, ", diff=", diff, " character=", character);

        // current.tspan.textContent += character;
        // if there is a mapping from charcode in glyphCache, use it

        var cachedGlyph1 = font.glyphCache[parseInt(character)];
        var cachedGlyph2 = gcMap[character];
        var cachedGlyph3 = font.glyphCache[cachedGlyph2];

        var unknownCharPattern = "[" + _.map(_.range(32), function(i) {
            return String.fromCharCode(i);
        }).join("") + "]";

        // if(cachedGlyph) {
        //     console.log("found the cached glyph for ", cachedGlyph, ", original was ", character);
        //     current.tspan.textContent += cachedGlyph.fontChar;
        // } else if (character.match(new RegExp(unknownCharPattern))) {

        if (character.match(new RegExp(unknownCharPattern))) {
            // console.error("wonky character ", character);
            // console.error("checking regex", unknownCharPattern, "g1", cachedGlyph1, "g2", cachedGlyph2, "g3", cachedGlyph3);
            current.tspan.textContent = cachedGlyph3.fontChar;
        } else {
            current.tspan.textContent += character;
        }

        // console.log("END trying to sub bad chars")



    }

    var lineEndX = current.x + x * textHScale;
    current.tspan.setAttributeNS(null, 'endX', '' + lineEndX);

    this.lastEndX = lineEndX;

    if (vertical) {
        current.y -= x * textHScale;
    } else {
        current.x += x * textHScale;
    }


    current.tspan.setAttributeNS(null, 'x',
                                 current.xcoords.map(pf).join(' '));

    if (diff) {
        current.tspan.setAttributeNS(null, 'spelling', spellings.join(','));
    }

    current.tspan.setAttributeNS(null, 'y', pf(-current.y));
    current.tspan.setAttributeNS(null, 'font-family', current.fontFamily);
    current.tspan.setAttributeNS(null, 'font-size',
                                 pf(current.fontSize) + 'px');
    if (current.fontStyle !== SVG_DEFAULTS.fontStyle) {
        current.tspan.setAttributeNS(null, 'font-style', current.fontStyle);
    }
    if (current.fontWeight !== SVG_DEFAULTS.fontWeight) {
        current.tspan.setAttributeNS(null, 'font-weight', current.fontWeight);
    }
    if (current.fillColor !== SVG_DEFAULTS.fillColor) {
        current.tspan.setAttributeNS(null, 'fill', current.fillColor);
    }

    current.txtElement.setAttributeNS(null, 'transform',
                                      pm(current.textMatrix) +
                                      ' scale(1, -1)' );
    current.txtElement.setAttributeNS(XML_NS, 'xml:space', 'preserve');
    current.txtElement.appendChild(current.tspan);
    current.txtgrp.appendChild(current.txtElement);

    this.tgrp.appendChild(current.txtElement);

}
