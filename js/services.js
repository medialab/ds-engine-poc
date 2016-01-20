'use strict';

/* Services */

angular.module('thisApp.services', [])
  
  // Facets declaration
  .factory('Facets', function () {
    // Namespace
    let ns = {};

    // Below we declare a series of facets we use in this project

    // The source of all data in there
    ns.tweets_csv = Facettage.newFacet('tweets.csv', {cached:true, type:'csv'});

    // The clean and rich list of tweets
    ns.tweetList = Facettage.newFacet('tweetList', {
      cached: true,
      dependencies:['tweets.csv'],
      // Optional, because implicit, but it is clearer to specify it
      type: 'csv',
      compute: function(){
        let tweets_csvData = Facettage.getFacet('tweets.csv').getData();
        let data = [...tweets_csvData].map(item => {
          let result = {};
          // Time: we use the # of millisecond, javascript style
          result.time = (new Date(item.time * 1000)).getTime();
          result.from_user_created_at = (new Date(item.from_user_created_at)).getTime();
          
          // Numbers
          result.retweet_count = parseInt(item.retweet_count, 10);
          result.favorite_count = parseInt(item.favorite_count, 10);
          result.from_user_tweetcount = parseInt(item.from_user_tweetcount, 10);
          result.from_user_followercount = parseInt(item.from_user_followercount, 10);
          result.from_user_friendcount = parseInt(item.from_user_friendcount, 10);
          result.from_user_favourites_count = parseInt(item.from_user_favourites_count, 10);
          result.from_user_listed = parseInt(item.from_user_listed, 10);

          // Extract hashtags
          // result.hashtags = item.text.match(/[#]+[A-Za-z0-9-_]+/g) || [];

          // // Extract mentions
          // result.mentions = item.text.match(/[@]+[A-Za-z0-9-_]+/g) || [];

          // // Extract words
          // let text = item.text;
          // result.hashtags.forEach(d => text = text.replace(d, d.substr(1,d.length)) );
          // result.mentions.forEach(d => text = text.replace(d, d.substr(1,d.length)) );
          // result.words = text.split(/\W+/);

          // Other transfered attributes
          [
            'id',
            'text',
            'lang',
            'location',
            'from_user_id',
            'from_user_name',
            'from_user_realname',
          ].forEach(k => {result[k] = item[k]})

          return result;
        });
        return data;
      },
      serialize: function (data) {
        return data.map(serializeTweet);
      },
      unserialize: function (data) {
        return data.map(unserializeTweet);
      },
    });

    // Tweet serialization
    function serializeTweet(item) {
      // In current state of data processing, we do nothing
      return item;
    }

    function unserializeTweet(item) {
      // Time
      item.time = parseInt(item.time, 10);
      item.from_user_created_at = parseInt(item.from_user_created_at, 10);
      
      // Numbers
      item.retweet_count = parseInt(item.retweet_count, 10);
      item.favorite_count = parseInt(item.favorite_count, 10);
      item.from_user_tweetcount = parseInt(item.from_user_tweetcount, 10);
      item.from_user_followercount = parseInt(item.from_user_followercount, 10);
      item.from_user_friendcount = parseInt(item.from_user_friendcount, 10);
      item.from_user_favourites_count = parseInt(item.from_user_favourites_count, 10);
      item.from_user_listed = parseInt(item.from_user_listed, 10);

      return item;
    }
    
    // List of #hashtags
    ns.hashtagList = Facettage.newFacet('hashtagList', {
      dependencies: ['tweetList'],
      compute: function () {
        const tweetList = Facettage.getFacet('tweetList').getData();
        return ns.extractHashtagsFromTweetList(tweetList, {all:true});
      }
    });

    // Get a list of #hashtags with a time span
    ns.getHashtagListForPeriod = function (from, to) {
      return Facettage.newFacet(`hashtagList-from-${from}-to-${to}`, {
        dependencies: ['tweetList'],
        ephemeral: true,
        compute: function () {
          const tweetList = Facettage.getFacet('tweetList').getData();
          return ns.extractHashtagsFromTweetList(tweetList, {all:false, from:from, to:to});
        }
      });
    }

    // A processing function factored for hashtag related facets
    ns.extractHashtagsFromTweetList = function (tweetList_, opts) {
      let tweetList;
      if (opts.all) {
        tweetList = tweetList_;
      } else {
        tweetList = tweetList_.filter(item => {
          return item.time >= opts.from && item.time <= opts.to;
        })
      }

      let hashtagsIndex = {};
      tweetList.forEach(item => {
        // Extract hashtags
        let hashtags = item.text.match(/[#]+[A-Za-z0-9-_]+/g) || [];
        hashtags.forEach(ht => {
          let htData = hashtagsIndex[ht] || {tweetIdList:[], temp:{dates:[], rtCounts:[], favCounts:[]}};
          htData.tweetIdList.push(item.id);
          // We get time as a number because of statistical operations (see below)
          htData.temp.dates.push(item.time);
          htData.temp.rtCounts.push(item.retweet_count);
          htData.temp.favCounts.push(item.favorite_count);
          hashtagsIndex[ht] = htData;
        });
      });

      // Compute metadata
      for (let ht in hashtagsIndex) {
        let htData = hashtagsIndex[ht];
        // Dates
        htData.temp.dates.sort();
        htData.dateFirst = htData.temp.dates[0];
        htData.dateLast = htData.temp.dates[htData.temp.dates.length-1];
        htData.dateMean = Math.round(d3.mean(htData.temp.dates));
        htData.dateMedian = Math.round(d3.median(htData.temp.dates));
        htData.dateDeviation = Math.round(d3.deviation(htData.temp.dates));
        // retweet_count
        htData.retweet_countMin = d3.min(htData.temp.rtCounts);
        htData.retweet_countMax = d3.max(htData.temp.rtCounts);
        htData.retweet_countMean = d3.mean(htData.temp.rtCounts);
        htData.retweet_countMedian = d3.median(htData.temp.rtCounts);
        htData.retweet_countDeviation = d3.deviation(htData.temp.rtCounts);
        // favorite_count
        htData.favorite_countMin = d3.min(htData.temp.favCounts);
        htData.favorite_countMax = d3.max(htData.temp.favCounts);
        htData.favorite_countMean = d3.mean(htData.temp.favCounts);
        htData.favorite_countMedian = d3.median(htData.temp.favCounts);
        htData.favorite_countDeviation = d3.deviation(htData.temp.favCounts);
        // Misc
        htData.tweetCount = htData.tweetIdList.length;
        delete htData.temp;
        hashtagsIndex[ht] = htData;
      }

      let hashtagList = [];
      for (let ht in hashtagsIndex) {
        let htData = hashtagsIndex[ht];
        htData.text = ht;
        hashtagList.push(htData);
      }

      return hashtagList;

    }

    // Get a network of #hashtags and @users with a time span
    ns.getHashtagUserNetworkForPeriod = function (from, to, tweetsLimit, hashtagsMinDegree_, usersMinDegree_, hashtagsLimit_, usersLimit_) {
      const hashtagsMinDegree = hashtagsMinDegree_ || 0;
      const usersMinDegree = usersMinDegree_ || 0;
      const hashtagsLimit = hashtagsLimit_ || 100000;
      const usersLimit = usersLimit_ || 100000;
      return Facettage.newFacet(`hashtagUserNetwork-from-${from}-to-${to}-tlimit-${tweetsLimit}`, {
        dependencies: ['tweetList'],
        ephemeral: true,
        compute: function () {
          const tweetList = Facettage.getFacet('tweetList').getData().filter(item => {
            return item.time >= from && item.time <= to;
          });

          if (tweetList.length > tweetsLimit) {
            return {overLimit: true, tweetCount:tweetList.length};
          }

          let hashtagsIndex = {};
          let usersIndex = {};
          let linksIndex = {};
          tweetList.forEach(item => {
            // User
            let user = '@' + item.from_user_name;
            let uData = usersIndex[user] || {count: 0, degree:0};
            uData.count++;
            usersIndex[user] = uData;
            // Extract hashtags
            let hashtags = item.text.match(/[#]+[A-Za-z0-9-_]+/g) || [];
            hashtags.forEach(ht => {
              // Hashtag
              let htData = hashtagsIndex[ht] || {count: 0, degree:0};
              htData.count++;
              hashtagsIndex[ht] = htData;
              // Link
              let link = user + ' ' + ht;
              let lData = linksIndex[link] || {count: 0};
              lData.count++;
              linksIndex[link] = lData;
              // Degrees: if lData === 1 then the link was just created
              if (lData.count === 1) {
                uData.degree++;
                htData.degree++;
              }
            });
          });

          // Filter nodes 1/2: filter by degree limit
          let keepNodes = {};
          for (let ht in hashtagsIndex) {
            let htData = hashtagsIndex[ht];
            if (htData.degree >= hashtagsMinDegree) {
              htData.keep = true;
              keepNodes[ht] = true;
            } else {
              htData.keep = false;
            }
          }
          for (let user in usersIndex) {
            let uData = usersIndex[user];
            if (uData.degree >= usersMinDegree) {
              uData.keep = true;
              keepNodes[user] = true;
            } else {
              uData.keep = false;
            }
          }
          for (let l in linksIndex) {
            let lData = linksIndex[l];
            let splt = l.split(' ');
            let source = splt[0];
            let target = splt[1];
            if (!(keepNodes[source] && keepNodes[target])) {
              delete linksIndex[l];
            }
          }
          for (let ht in hashtagsIndex) {
            let htData = hashtagsIndex[ht];
            if (!htData.keep) {delete hashtagsIndex[ht]}
          }
          for (let user in usersIndex) {
            let uData = usersIndex[user];
            if (!uData.keep) {delete usersIndex[user]}
          }

          // Filter nodes 2/2: limit by count
          let hashtagsAsList = [];
          for (let ht in hashtagsIndex) {
            let htData = hashtagsIndex[ht];
            htData.id = ht;
            hashtagsAsList.push(htData);
          }
          let usersAsList = [];
          for (let user in usersIndex) {
            let uData = usersIndex[user];
            uData.id = user;
            usersAsList.push(uData);
          }
          keepNodes = {}
          hashtagsAsList.sort(function(a,b){
            return b.count - a.count;
          })
            .forEach((htData, i) => {
              if (i < hashtagsLimit) {
                keepNodes[htData.id] = true;
                hashtagsIndex[htData.id].keep = true;
              } else {
                keepNodes[htData.id] = false;
                hashtagsIndex[htData.id].keep = false;
              }
            })
          usersAsList.sort(function(a,b){
            return b.count - a.count;
          })
            .forEach((uData, i) => {
              if (i < usersLimit) {
                keepNodes[uData.id] = true;
                usersIndex[uData.id].keep = true;
              } else {
                keepNodes[uData.id] = false;
                usersIndex[uData.id].keep = false;
              }
            })
          for (let l in linksIndex) {
            let lData = linksIndex[l];
            let splt = l.split(' ');
            let source = splt[0];
            let target = splt[1];
            if (!(keepNodes[source] && keepNodes[target])) {
              delete linksIndex[l];
            }
          }
          for (let ht in hashtagsIndex) {
            let htData = hashtagsIndex[ht];
            if (!htData.keep) {delete hashtagsIndex[ht]}
          }
          for (let user in usersIndex) {
            let uData = usersIndex[user];
            if (!uData.keep) {delete usersIndex[user]}
          }


          let nodeList = [];
          for (let ht in hashtagsIndex) {
            let htData = hashtagsIndex[ht];
            nodeList.push({
              id: ht,
              label: ht,
              type: 'hashtag',
              size: 10 * Math.sqrt(1+htData.count),
              count: htData.count,
              x: Math.random(),
              y: Math.random(),
              color: '#AA9999',
              // color: '#2E3B94',
              degree: htData.degree,
            });
          }
          for (let user in usersIndex) {
            let uData = usersIndex[user];
            if (uData.keep) {
              nodeList.push({
                id: user,
                label: user,
                type: 'user',
                size: 10 * Math.sqrt(1+uData.count),
                count: uData.count,
                x: Math.random(),
                y: Math.random(),
                color: '#333344',
                // color: '#A81A00',
                degree: uData.degree,
              });
            }
          }
          let edgeList = [];
          let count = 0;
          for (let l in linksIndex) {
            let lData = linksIndex[l];
            let splt = l.split(' ');
            let source = splt[0];
            let target = splt[1];
            edgeList.push({
              id: 'e' + count++,
              source: source,
              target: target,
              count: lData.count,
            });
          }

          return {network: {nodes: nodeList, edges: edgeList}, tweetCount:tweetList.length || 0};
        }
      });
    }

    // Total tweet count over time
    ns.tweetsTotalDaily = Facettage.newFacet('tweetsTotalDaily', {
      cached: true,
      dependencies: ['tweetList'],
      compute: function(){
        let tweetList = Facettage.getFacet('tweetList').getData();
        let dateIndex = {};

        tweetList.some(item => {
          let dateAsTime = getJustTheDate(item.time).getTime();
          let dateData = dateIndex[dateAsTime] || {count:0, dateString:(new Date(dateAsTime)).toDateString()};
          dateData.count++;
          dateIndex[dateAsTime] = dateData;
        });

        let list = [];
        for (let dateAsTime in dateIndex) {
          let dateData = dateIndex[dateAsTime];
          dateData.time = dateAsTime;
          list.push(dateData);
        }
        return list;

        function getJustTheDate(time) {
          return new Date((new Date(time)).toDateString());
        }
        
      },
      serialize: data => {
        return data;
      },
      unserialize: data => {
        return data.map(d => {
          // Numbers
          d.count = parseInt(d.count, 10);
          d.time = parseInt(d.time, 10);
          return d;
        });
      },
    });

    // Various simple facets
    ns.tweetCount = Facettage.newFacet('tweetCount', {
      dependencies: ['tweetList'],
      uncacheable: true,
      compute: function(){
        return Facettage.getFacet('tweetList').getData().length;
      },
    });

    ns.usersOrientation = Facettage.newFacet('mainUsersOrientation.csv', {cached:true, type:'csv'});

    return ns;
  })
