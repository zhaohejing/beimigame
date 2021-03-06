var beiMiCommon = require("BeiMiCommon");
cc.Class({
    extends: beiMiCommon,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        goldcoins: {
            default: null,
            type: cc.Label
        },
        cards: {
            default: null,
            type: cc.Label
        },
        player: {
            default: null,
            type: cc.Prefab
        },
        poker: {
            default: null,
            type: cc.Prefab
        },
        poker_min: {
            default: null,
            type: cc.Prefab
        },
        myself: {
            default: null,
            type: cc.Prefab
        },
        atlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        catchbtn: {
            default: null,
            type: cc.Node
        },
        timer: {
            default: null,
            type: cc.Node
        },
        timer_num:{
            default: null,
            type: cc.Label
        },
        lastcards:{
            default: null,
            type: cc.Node
        },
        playbtn:{
            default: null,
            type: cc.Node
        },
        notallow:{
            default: null,
            type: cc.Node
        },
        operesult:{
            default: null,
            type: cc.Node
        },
        donottake:{
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        if(this.timer){
            this.timer.active = false ;
        }
        if(this.catchbtn){
            this.catchbtn.active = false ;
        }
        if(this.playbtn){
            this.playbtn.active = false ;
        }
        if(this.notallow){
            this.notallow.active = false ;
        }
        if(this.operesult){
            this.operesult.active = false ;
        }

        this.playerspool = new cc.NodePool();
        this.myselfpool = new cc.NodePool();
        this.pokerpool = new cc.NodePool();     //背面
        this.minpokerpool = new cc.NodePool();     //背面


        this.selectedcards = new Array();   //存放当前玩家 选中 的牌

        this.cardslist = new Array();

        for(i=0 ; i<2 ; i++){
            this.playerspool.put(cc.instantiate(this.player)); // 创建节点
        }
        for(i =0 ; i<25 ; i++){
            this.pokerpool.put(cc.instantiate(this.poker));     //牌-背面
        }
        for(i =0 ; i<60 ; i++){
            this.minpokerpool.put(cc.instantiate(this.poker_min));     //牌-背面
        }
        this.myselfpool.put(cc.instantiate(this.myself));

        if(this.ready()){
            if(cc.beimi.user.goldcoins > 9999){
                var num = cc.beimi.user.goldcoins / 10000  ;
                this.goldcoins.string = num.toFixed(2) + '万';
            }else{
                this.goldcoins.string = cc.beimi.user.goldcoins;
            }
            this.cards.string = cc.beimi.user.cards + "张" ;
        }
        if(this.myselfpool.size() > 0 && cc.beimi){
            this.playermysql = this.myselfpool.get();
            this.playermysql.parent = this.root() ;
            this.playermysql.setPosition(-520,-180);
            var render = this.playermysql.getComponent("PlayerRender") ;
            render.initplayer(cc.beimi.user);
        }
    },
    catchtimer:function(times){

        if(this.playbtn){
            this.playbtn.active = false ;
        }
        if(this.timer){
            this.timer.active = true ;
        }
        if(this.catchbtn){
            this.catchbtn.active = true ;
        }
        if(this.operesult){
            this.operesult.active = false ;
        }

        let self = this ;
        var gameTimer = require("GameTimer");
        this.beimitimer = new gameTimer();
        this.timesrc = this.beimitimer.runtimer(this , this.timer , this.atlas , this.timer_num , this.timer_num , times);
    },
    catchresult:function(data){
        if(this.timer){
            this.timer.active = false ;
        }
        if(this.catchbtn){
            this.catchbtn.active = false ;
        }
        if(this.playbtn){
            this.playbtn.active = false ;
        }
        if(this.timesrc){
            this.beimitimer.stoptimer(this , this.timer , this.timesrc);
        }
        this.doOperatorResult("catch" , data.docatch , false) ;
    },
    hideresult:function(){
        if(this.operesult){
            this.operesult.active = false ;
        }
    },
    lasthands:function(self, game,data){   //设置地主
        this.setDizhuFlag(data) ;
        if(this.operesult){
            this.operesult.active = false ;
        }
    },
    setDizhuFlag:function(data){
        var render = this.playermysql.getComponent("PlayerRender") ;
        render.setDizhuFlag(data);
    },
    lasttakecards:function(game , self , cardsnum ,lastcards , data){
        if(this.result){
            this.result.active = false ;
        }
        if(this.playbtn){
            this.playbtn.active = false ;
        }
        if(this.catchbtn){
            this.catchbtn.active = false;
        }
        if(this.jsq){
            this.jsq.active = false ;
        }
        if(this.lastcards){
            this.lastcards.active = true ;
        }
        if(this.timesrc){
            this.beimitimer.stoptimer(this , this.timer , this.timesrc);
        }
        for(var i=0 ; i<this.cardslist.length ; i++){
            this.pokerpool.put(this.cardslist[i]) ;//回收回去
        }
        this.cardslist.splice(0,this.cardslist.length) ;//删除数组里的所有内容
        if (data.donot == false) {    //选择出牌或默认出牌
            for(var i=0 ; i<lastcards.length ; i++){
                this.playcards(self , i , lastcards[i]) ;
            }
        }else{
            this.doOperatorResult("lasttakecards" , true , data.sameside) ;
        }
    },

    playcards:function(self , index , card){
        var cacheCard ;
        for(var inx = 0 ; inx<self.pokercards.length ; inx++){
            let pc = self.pokercards[inx] ;
            if(pc.card == card){
                cacheCard = pc ; break ;
            }
        }
        if(cacheCard != null){
            cacheCard.x = index * 30 - 30 ;
            cacheCard.y = 0;

            cacheCard.zIndex = 100 - i ;

            cacheCard.setScale(0.5,0.5);

            cacheCard.parent = this.lastcards ;


            this.cardslist[this.cardslist.length] = cacheCard ;
        }
    },
    /**
     *
     * @param game
     * @param times
     * @param automic 不允许 不出
     */
    playtimer:function(game , times , automic){
        if(this.timer){
            this.timer.active = true ;
        }
        if(this.playbtn){
            this.playbtn.active = true ;
        }
        if(this.catchbtn){
            this.catchbtn.active = false;
        }
        if(this.lastcards){
            this.lastcards.active = false ;
        }
        if(this.operesult){
            this.operesult.active = false ;
        }

        if(automic == true){
            this.donottake.active = false ;
        }else{
            this.donottake.active = true ;
        }

        for(var i=0 ; i<this.cardslist.length ; i++){
            game.pokerpool.put(this.cardslist[i]) ;//回收回去
        }
        let self = this ;
        var gameTimer = require("GameTimer");
        this.beimitimer = new gameTimer();
        this.timesrc = this.beimitimer.runtimer(this , this.timer , this.atlas , this.timer_num , this.timer_num , times);
    },
    doOperatorResult:function(oper , resvalue , sameside){
        this.operesult.active = true ;
        if(oper == "catch"){
            if(resvalue == true){
                for(var i=0 ; i<this.operesult.children.length ; i++){
                    this.operesult.children[i].active = false ;
                    if(this.operesult.children[i].name == "提示_抢地主"){
                        this.operesult.children[i].active = true ;
                    }
                }
            }else {
                for (var i = 0; i < this.operesult.children.length; i++) {
                    this.operesult.children[i].active = false;
                    if (this.operesult.children[i].name == "提示_不抢") {
                        this.operesult.children[i].active = true;
                    }

                }
            }
        }else if(oper == "lasttakecards"){
            if(sameside == true){
                for (var i = 0; i < this.operesult.children.length; i++) {
                    this.operesult.children[i].active = false;
                    if (this.operesult.children[i].name == "不要") {
                        this.operesult.children[i].active = true;
                    }
                }
            }else{
                for (var i = 0; i < this.operesult.children.length; i++) {
                    this.operesult.children[i].active = false;
                    if (this.operesult.children[i].name == "要不起") {
                        this.operesult.children[i].active = true;
                    }
                }
            }
        }
    },
    doSelectCard:function(card){
        var existcard = this.selectedcards.find(function(pokercard){
            pokercard.card == card
        });
        if(existcard == undefined){
            this.selectedcards.push(card) ;
        }
    },
    doUnSelectCard:function(card){
        var inx = this.selectedcards.indexOf(card);
        if(inx >= 0){
            this.selectedcards.splice(inx , inx+1) ;
        }
    },
    clean:function(context){
        if(this.catchbtn){
            this.catchbtn.active = false;
        }
        if(this.lastcards){
            this.lastcards.active = false ;
        }
        if(this.operesult){
            this.operesult.active = false ;
        }
        var render = this.playermysql.getComponent("PlayerRender") ;
        render.clean(context) ;
    },
    restart:function(){
        for(i=0 ; i<2 ; i++){
            this.playerspool.put(cc.instantiate(this.player)); // 创建节点
        }

        /**
         * 费劲巴拉的收集起来，然后又给销毁了，浪费资源！！！
         */
        this.pokerpool.clear();
        this.minpokerpool.clear();

        for(var inx =0 ; inx<25 ; inx++){
            this.pokerpool.put(cc.instantiate(this.poker));     //牌-背面
        }
        for(var inx=0 ; inx<60 ; inx++){
            this.minpokerpool.put(cc.instantiate(this.poker_min));     //牌-背面
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
