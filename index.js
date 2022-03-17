class Statter {
    _raw;
    _parsed = [];
    _rawMemeList = [];
    _rawFileTypes = [];
    authors = {};
    sortedByAuthors = {};

    /**
     * @param {...data} stats 
     */
    constructor(stats) {
        this._raw = stats;
        this.getAuthors();
        this._parsed = this.filteredMessages.map(i => this.parseMessage(i));
        this._rawMemeList = this._parsed.map(i => i.content).flat();
        this._rawFileTypes = this._rawMemeList.map(i => this.parseFileName(i));
        this.getMessagesByUser();
    }

    getAuthors() {
        var that = this;
        for (let i of this._raw.messages) if (i?.author?.id && !this.authors[i.author.id]) this.authors[i.author.id] = {
            ...i.author,
            get memes() {
                return that.sortedByAuthors[this.name].memeList;
            }
        };
        return this;
    };

    parseMessage(message) {
        var that = this;
        if (message.type != 'Default') return false;
        return {
            id: message.id,
            ts: new Date(message.timestamp),
            _user: message.author.id,
            content: [...message.attachments.map(i => i.url), ...message.embeds.map(i => i.url)],

            get user() {
                return that.getAuthorName(this._user);
            }
        };
    };

    getAuthorName(id) {
        return this.authors[id]?.name;
    };

    getMessagesByUser() {
        this.sortedByAuthors = {};
        for (let i of this._parsed) {
            if (!this.sortedByAuthors[i.user]) this.sortedByAuthors[i.user] = {
                messages: [],
                get memeList() {
                    return this.messages.map(i => i.content).flat();
                },
                get memeCount() {
                    return this.memeList.length;
                }
            };
            this.sortedByAuthors[i.user].messages.push(i);
        }
        return this;
    }

    get messageCount() {
        return this._raw.messageCount;
    }

    get filteredMessages() {
        return this._raw.messages.filter(i => i.type === 'Default');
    }

    get memeCount() {
        return this._rawMemeList.length;
    }

    parseFileName(file) {
        return {
            link: file,
            name: file.split('/').pop().split('.').shift(),
            type: file.split('.').pop()
        }
    };

    get randomMeme() {
        return this.parseFileName(this._rawMemeList[Math.floor(Math.random() * this._rawMemeList.length)]);
    }

    isKnownFileType(ext) {
        return ["mov", "mp4", "webm", "MP4", "jpg", "png", "gif", "webp", "mp3"].includes(ext);
    }

}

const STATS = new Statter(_data);

$('.count').each(function () {
    $(this).prop('Counter', 0).animate({
        Counter: STATS.memeCount
    }, {
        duration: 4000,
        easing: 'swing',
        step: function (now) {
            $(this).text(Math.ceil(now));
        }
    });
});

$('#random-meme-button').on('click', function () {
    var meme = STATS.randomMeme;
    $('#random-meme-audio').attr('src', '');
    $('#random-meme-viewer').attr('src', '');
    $('#random-meme-img').attr('src', '');
    if (["mov", "mp4", "webm", "MP4"].includes(meme.type)) {
        $('#random-meme-viewer').attr('src', meme.link);
        document.getElementById('random-meme-viewer').play()
    } else if (["jpg", "png", "gif", "webp"].includes(meme.type)) {
        $('#random-meme-img').attr('src', meme.link);
    } else if (meme.type == "mp3") {
        $('#random-meme-audio').attr('src', meme.link);
        document.getElementById('random-meme-audio').play();
    } else {
        alert('dont know how to handle type:  ' + meme.type)
    }
});


var options = {
    authorMemeCount: {
        series: Object.values(STATS.authors).map(i => i.memes.length),
        chart: {
            width: 380,
            type: 'pie',
        },
        labels: Object.values(STATS.authors).map(i => i.name),
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom',
                    colors: 'white'
                }
            }
        }]
    },
    memeTypeCount: {
        series: Object.values(Object.values(STATS._rawFileTypes).filter(i => STATS.isKnownFileType(i.type)).map(i=>i.type.toLowerCase().trim()).reduce(function (acc, curr) {
            return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
        }, {})),
        chart: {
            width: 380,
            type: 'pie',
        },
        labels: Object.keys(Object.values(STATS._rawFileTypes).filter(i => STATS.isKnownFileType(i.type)).map(i=>i.type.toLowerCase().trim()).reduce(function (acc, curr) {
            return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
        }, {})),
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom',
                }
            }
        }]
    },
}
console.log(options)

var authorMemeCount = new ApexCharts(document.querySelector("#authorMemeCount"), options.authorMemeCount);
authorMemeCount.render();

var memeTypeCount = new ApexCharts(document.querySelector("#memeTypeCount"), options.memeTypeCount);
memeTypeCount.render();