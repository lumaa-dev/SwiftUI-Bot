/*


    "Doc", "Cache" classes made by Lumaa
    Documentation of these classes are made using Mintlify


*/
const fs = require("fs");
const { appleDocs, maxVoteDel: voteDel, searchOptions } = require("./config.json")

/**
 * User-made Apple Documentation (with image)
 */
class Doc {
    /**
     * Creates all the required data
     */
    constructor() {
        this.doc = {
            fileName: undefined,
            name: undefined,
            description: undefined,
            id: null,
            editDate: new Date(),
            creationDate: new Date(),
            beta: false,
            jsonPath: undefined,
            hasImage: undefined,
            imagePath: undefined,
            url: `${appleDocs}/${this.name}`
        }
        return;
    }

    /**
     * It creates a JSON file with the name of the title parameter, and the content of the JSON file is
     * the title, description, creation date, etc...
     * @param {String} title - The title of the document.
     * @param {String} [description] - The description of the document.
     * @param {Boolean} [beta=false] - boolean - if the documentation is in beta, it will be marked as such.
     * @returns {Doc}
     */
    init(title, description = "", beta = false) {
        const sep = fileSeparator()
        const fileTitle = title.toLowerCase().split(/ +/g)[0]
        const filePath = `${__dirname}${sep}docs${sep}${fileTitle}.json`;
        const imagePath = `${__dirname}${sep}docs${sep}${fileTitle}.jpg`; // HAS TO BE JPG
        const wrongImagePath = `${__dirname}${sep}docs${sep}${fileTitle}.png`; // warn if png found

        const hasFile = fs.existsSync(filePath);
        const hasImage = fs.existsSync(imagePath);
        const hasWrongImage = fs.existsSync(wrongImagePath);
        var file = null;

        if (hasWrongImage) { console.error(new Error("Image found does not have .jpg extension")) }

        if (hasFile) {
            file = require(`./docs/${fileTitle}.json`);
            let { title: _title, description: _description, creationDate: _creation, hasImage: _hasImage } = file;
            if ((_title !== title && _description !== description) || _hasImage !== hasImage) {
                // updated doc
                this.doc = {
                    fileName: fileTitle,
                    name: title,
                    description: description,
                    editDate: new Date(),
                    creationDate: _creation,
                    beta: beta,
                    jsonPath: filePath,
                    hasImage: hasImage,
                    imagePath: hasImage ? imagePath : undefined,
                    url: `${appleDocs}/${title}`,
                }

                fs.writeFile(filePath, JSON.stringify(this.doc), { encoding: "utf-8" }, () => console.log(`Updated "${fileTitle}.json"`))
                return this.doc
            } else {
                // same doc
                this.doc = file;

                console.log(`Initialized same ${fileTitle}.json as before`)
                return file;
            }
        } else {
            // new doc
            this.doc = {
                fileName: fileTitle,
                name: title,
                description: description,
                editDate: new Date(),
                creationDate: new Date(),
                beta: beta,
                jsonPath: filePath,
                hasImage: hasImage,
                imagePath: hasImage ? imagePath : undefined,
                url: `${appleDocs}/${title}`
            }

            fs.writeFile(filePath, JSON.stringify(this.doc), { encoding: "utf-8" }, () => console.log(`Created "${fileTitle}.json"`))
            return this;
        }
    }

    update(doc) {
        doc.doc.editDate = new Date()
        fs.writeFileSync(doc.doc.jsonPath, doc.doc)
    }

    /**@deprecated Axios or Cheerio cannot use Javascript */
    async oinit(name, hasImage = false) {
        throw new Error("Function \"oinit\" is deprecated. Use \"init\".")
        const { appleDocs } = require("./config.json");
        const sep = fileSeparator()
        const filePath = `${__dirname}${sep}docs${sep}${name}.json`
        if (!fs.existsSync(filePath)) {
            let officialDocs = await getHTML(`${appleDocs}/${name.toLowerCase()}`)
            let docHtml = officialDocs.html();

            var docName = normalizeHTML(docHtml.match(/(<span data-v-09dcf724="" data-v-91bcffaa="">[A-Z][a-z]+<\/span>)/g)[0])
            var docDesc = normalizeHTML(docHtml.match(/(<div data-v-702ae484="" data-v-b3ef72b8="" data-v-09dcf724="" class="abstract content" data-v-1aa4701e="">).+(<\/div><!)/g)[0].replace("<!", ""))
            var addedImage = null
            var isPng = null
            //title <span data-v-09dcf724="" data-v-91bcffaa="">
            //description <div data-v-702ae484="" data-v-b3ef72b8="" data-v-09dcf724="" class="abstract content" data-v-1aa4701e="">

            if (hasImage && (fs.existsSync(`${__dirname}${sep}docs${sep}${name}.png`) || fs.existsSync(`${__dirname}${sep}docs${sep}${name}.jpg`))) {
                isPng = fs.existsSync(`${__dirname}${sep}docs${sep}${name}.png`);
                let path = `${__dirname}${sep}docs${sep}${name}${isPng ? ".png" : ".jpg"}`

                addedImage = fs.readFileSync(path, {encoding: 'utf8'})
            }

            this.name = docName
            this.description = docDesc
            this.hasImage = hasImage
            this.image = addedImage

            this._data = {
                sep: sep,
                path: filePath,
                cached: fs.existsSync(filePath),
                imageFormat: isPng,
            }

            fs.writeFileSync(filePath, { _data: this._data, name: this.name, description: this.description, hasImage: this.hasImage })
        } else {
            const { _data, name, hasImage, image } = require(filePath)
            var updatedImage = null
            const actualImagePath = _data.filePath.replace(".json", _data.isPng ? ".png" : ".jpg")
            const newImagePath = _data.filePath.replace(".json", _data.isPng ? "_new.png" : "_new.jpg")

            if (hasImage) {
                let exist = fs.existsSync(actualImagePath)
                if (exist) {
                    let exist = fs.existsSync(newImagePath)
                    if (exist) {
                        let path = _data.filePath.replace(".json", _data.isPng ? "_new.png" : "_new.jpg")
                        updatedImage = fs.readFileSync(path, {encoding: 'utf8'})
                    } else {
                        updatedImage = image
                    }
                } else {
                    hasImage = false
                    this.hasImage = false
                }
            }

            if ((updatedImage !== image) && hasImage) {
                // new image
                console.log(`New image detect for ${name}.json`)
                archiveImage(actualImagePath, newImagePath)
            }
        }
    }
}
/**
 * Cache for the "Doc" class
 */
class Cache {
    /**
     * Creates all the required data
     */
    constructor() {
        /**@type {Doc[]} All the docs in the cache */
        this.docs = []
        this._data = {
            /**@type {Doc[]} Docs that users request to be editted */
            editRequests: [],
            /**@type {Array} Docs that users request to be deleted */
            deleteRequests: [],
            separator: fileSeparator()
        }
    }

    /**
     * It returns a list of documents that have the same name as the document passed in
     * @param {Doc} doc - The document to be searched in the cache
     * @returns {Doc|Doc[]} The searched Doc
     */
    has(doc, one = true) {
        if (one) return this.docs.filter((_doc) => { 
            let { doc: __doc } = _doc
            return __doc == doc.doc
        })[0]
        if (!one) return this.docs.filter((_doc) => { 
            let { doc: __doc } = _doc
            return __doc == doc.doc
        })

    }

    /**
     * The amount of Docs in the cache
     */
    length() {
        return this.docs.length
    }

    /**
     * It adds a document to the docs array.
     * @param {Doc} doc - The document to be added to the collection.
     * @returns {Doc[]} The docs array.
     */
    add(doc) {
        this.docs.push(doc)
        return this.docs;
    }

    /**
     * It takes an index and a new document, and replaces the document at that index with the new
     * document
     * @param {Number} index - The index of the document to edit.
     * @param {Doc} newDoc - The new document to replace the old one with.
     * @returns {Doc} The old Doc is being returned.
     */
    edit(index, newDoc) {
        const oldDoc = this.docs[index]
        this.docs[index] = newDoc;

        return oldDoc;
    }

    /**
     * It searches for a file in a directory and returns the file(s) if it exists
     * @param {String} query - The query you want to search for.
     * @param [options] - Options to diversify the results
     * @returns {Doc[]|Doc} An array of file names
     */
    search(query, options = searchOptions) {
        var matches = this.docs
        query = query.toLowerCase().trim();
    
        matches = matches.filter((doc) => {
            var match = null;
            let { doc: _doc } = doc
            let name = _doc.name.toLowerCase()
            let description = _doc.description.toLowerCase()
            // console.log(`name: ${name}\nquery: ${query}`)
            if (options.exactName) match = name === query
            if (options.byName && match !== null) match = name.includes(query)
            if (options.byDescription && match !== null) match = description.includes(query)

            return match;
        })

        if (options.exactName) { matches = matches[0] }
    
        return matches;
    }

    /**
     * It returns the index of the document in the array of documents.
     * @param {Doc|String} doc - The document to be removed.
     * @returns {Number} The index of the document in the array.
     */
    indexOf(doc) {
        var fileName;
        if (typeof doc == "string") fileName = doc
        else fileName = doc.doc.fileName
        
        var names = []
    
        this.docs.forEach((doc) => {
            let { doc: _doc } = doc
            names.push(`${_doc.fileName}.json`)
        })

        return names.indexOf(`${fileName}.json`)
    }

    /**
     * The function takes in a document, and pushes the document's name into the editRequests array.
     * @param {Doc} doc - The document that was edited.
     */
    report(doc) {
        let { doc: _doc } = doc
        this._data.editRequests.push(_doc.fileName)
    }

    /**
     * It deletes a document from the database.
     * @param {Doc} doc - The document to be deleted.
     * @returns The docs array.
     */
    delete(doc) {
        let i = this.indexOf(doc)
        this.docs.splice(i, 1)
        return this.docs;
    }

    /**
     * It deletes a vote from the database.
     * @param {Doc|String} doc - The document to be deleted
     * @param {Any} voted - Identifiable user variable
     */
    deleteVote(doc, voter = null) {
        // { count: 0, doc: doc, voted: [] }

        let i = this.indexOf(doc)
        if (i === -1) throw new Error("Doc not found")
        let filtered = this._data.deleteRequests.filter((req) => req.doc == this.docs[i])[0]
        if (filtered !== undefined) {
            const iDel = this._data.deleteRequests.indexOf(filtered)
            let { doc: _doc, voted } = filtered

            if (!voted.includes(voter)) {
                let count = this._data.deleteRequests[iDel].count + 1
                if (count >= voteDel) {
                    /**@type {Doc} */
                    let _doc = this._data.deleteRequests[iDel].doc
                    if (_doc.doc.hasImage) archiveImage(_doc.doc.imagePath)

                    fs.unlinkSync(_doc.doc.jsonPath)
                    this.docs.splice(i, 1)
                    this._data.deleteRequests.splice(iDel, 1)

                    console.log(`Deleted "${_doc.doc.fileName}.json"`)
                } else {
                    if (voter !== null) {
                        this._data.deleteRequests[iDel].voted.push(voter)
                    } else {
                        this._data.deleteRequests[iDel].voted = []
                    }
                    this._data.deleteRequests[iDel] = {
                        count: this._data.deleteRequests[iDel].count + 1,
                        doc: _doc,
                        voted: this._data.deleteRequests[iDel].voted
                    }
                }

                return this._data.deleteRequests
            } else {
                console.error(new Error("Voter already voted"))
            }
        } else {
            if (voter !== null) {
                var v = [voter]
            }
            let o = {
                count: 1,
                doc: this.docs[i],
                voted: v ?? [],
            }

            this._data.deleteRequests.push(o)
            return this._data.deleteRequests
        }
    }
}

module.exports = { Doc, Cache }

/**
 * It takes an old image path and a new image path, and moves the old image to a folder called
 * "archivedImages" and moves the new image to the old image's path.
 * @param {String} oldImagePath - The path to the old image
 * @param {String?} newImagePath - The path to the new image
 */
 function archiveImage(oldImagePath, newImagePath) {
    var archivePath = findArchivePath()
    let archivable = fs.existsSync(archivePath)
    var fileName = oldImagePath.split(fileSeparator())
    fileName = fileName[fileName.length-1]
    if (!archivable) {
        fs.mkdirSync(archivePath)
    }

    fs.renameSync(oldImagePath, `${archivePath}${fileSeparator()}${fileName}`)
    console.log("Archived old image")

    if (typeof newImagePath == "string") {
        fs.renameSync(newImagePath, oldImagePath)
        console.log("Changed new image name")
    }

    function findArchivePath() {
        let temp = oldImagePath.split(fileSeparator())
        temp.pop()
        const path = `${temp.join(fileSeparator())}${fileSeparator()}archivedImages`
        return path;
    }
}

// OFF TOPIC

/**
 * If the directory name includes a forward slash, return a forward slash, else return a backslash.
 * @returns {"/" | "\\"} The file separator for the current operating system.
 */
function fileSeparator() {
    if (__dirname.includes("/")) return "/"; else return "\\"
}

/**
 * It takes a URL, makes a request to that URL, and returns a cheerio object.
 * @deprecated
 * @param {URL|String} url - The URL of the page you want to scrape.
 * @returns {cheerio.CheerioAPI} The HTML of the page.
 */
async function getHTML(url) {
    const { data } = await axios.get(url)
    return cheerio.load(data)
}

/**
 * It takes a string of HTML and returns the text inside the first tag
 * @deprecated
 * @param {String} [html=<div class='made by lumaa'>Haha text goes brrr</div>] - The HTML to normalize. Example: `<div class='made by lumination'>Haha text goes brrr</div>`
 * @returns {String} "Haha text goes brrr"
 */
function normalizeHTML(html = "<div class='made by lumaa'>Haha text goes brrr</div>") {
    let t = html.match(/>.+</g)[0]
    return t.substring(1, t.length - 1)
}