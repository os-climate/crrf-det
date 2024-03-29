#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readdirSync, readFileSync, rmSync } from 'fs';
import si from 'search-index';


function processNumbers(input) {
    var r = [];
    for (let e of input.split(' ')) {
        var p = parseFloat(e.replace(/,/g, '').replace(/\$/g, '').replace(/€/g, '').replace(/£/g, ''));
        if (isNaN(p) ||
            (p < 5 && p >= 0 && parseInt(p) == parseFloat(p)) ||
            (p >= 1900 && p <= 2100 && parseInt(p) == parseFloat(p)))
            r.push(e);
        else
            r.push('NUMERICVALUE');
    }
    return r.join(' ');
}


async function build(argv) {
    // initialize an index
    var files = readdirSync(argv.path);
    rmSync(argv.path + '/search-index', { recursive: true, force: true });
    const { PUT } = await si({ name: argv.path + '/search-index' });
    files.forEach(async(file) => {
        if (!(file.startsWith('page.') &&
            file.endsWith('.json')))
            return;
        var pageNum = file.substr(5, file.length - 10);
        var page = JSON.parse(readFileSync(argv.path + '/' + file));
        if (!page.content)
            return;
        var data = [];
        for (var i = 0; i < page.content.length; i++) {
            var c = page.content[i];
            var doc = { _id: pageNum + '-' + i };
            if (c.type == 'text')
                doc.text = processNumbers(c.content);
            else if (c.type == 'table') {
                doc.table = '';
                for (var j = 0; j < c.content.length; j++)
                    doc.table += processNumbers(c.content[j].join(' ')) + '\n';
            }
            data.push(doc);
        }
        await PUT(data, {
            ngrams: {
                lengths: [ 1, 2, 3 ],
                join: ' '
            }
        });
    });
}


function search_result_compare(a, b) {
    if (a.score < b.score)
      return 1;
    if (a.score > b.score)
      return -1;
    return 0;
}


async function search(argv) {
    // initialize an index
    const { QUERY } = await si({ name: argv.path + '/search-index' });
    // toy query builder
    var q_inc_and = [];
    var q_exc_or = [];
    var field = false;
    for (let kw of argv.keywords) {
        if (field == false) {
            if (kw.startsWith('table:')) {
                field = 'table';
                kw = kw.substr(6);
            }
            else if (kw.startsWith('text:')) {
                field = 'text';
                kw = kw.substr(5);
            }
            else
                field = null;
        }
        if (kw.startsWith('_')) {
            if (field)
                q_exc_or.push(field + ':' + kw.substr(1));
            else
                q_exc_or.push(kw.substr(1));
        }
        else {
            if (field)
                q_inc_and.push(field + ':' + kw);
            else
                q_inc_and.push(kw);
        }
    }
    if (q_inc_and.length == 0)
        return;
    q_inc_and.push('NUMERICVALUE');
    var q = {};
    if (q_exc_or.length > 0) {
        q.NOT = {
            INCLUDE: {
                AND: q_inc_and
            },
            EXCLUDE: {
                OR: q_exc_or
            }
        };
    } else {
        q.AND = q_inc_and;
    }
    await QUERY(q, {
        SCORE: 'TFIDF',
        SORT: true
    })
    .then(results => {
        var group = {};
        for (var i = 0; i < results.RESULT.length; i++) {
            var idp = results.RESULT[i]._id.split('-');
            if (idp[0] in group) {
                group[idp[0]].cindex.push(parseInt(idp[1]));
                group[idp[0]].score += results.RESULT[i]._score;
            }
            else {
                group[idp[0]] = {
                    cindex: [parseInt(idp[1])],
                    score: results.RESULT[i]._score
                }
            }
        }
        var pages = [];
        for (const page in group)
            pages.push({page: parseInt(page), ...group[page]})
        pages.sort(search_result_compare);
        console.log('%s', JSON.stringify(pages));
    });
}


const args = yargs(hideBin(process.argv))
    .scriptName('det-search')
    .usage('$0 <cmd> [args]')
    .command('search <path> <keywords..>', 'search the JSON structure for keywords', (yargs) => {
        return yargs.positional('path', {
            type: 'string',
            describe: 't-pdf output path containing a translated JSON structure for the PDF file'
        }).positional('keywords', {
            type: 'string',
            describe: 'query'
        });
    }, search)
    .command('build <path>', 'build search index against PDF', (yargs) => {
        return yargs.positional('path', {
            type: 'string',
            describe: 't-pdf output path containing a translated JSON structure for the PDF file'
        })
    }, build)
    .demandCommand(1, 'A command must be given')
    .help('h')
    .alias('h', 'help')
    .version(false)
    .showHelpOnFail(true)
    .argv;

