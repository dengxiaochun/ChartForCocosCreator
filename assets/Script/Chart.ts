const {ccclass, property} = cc._decorator;

function random(min,max) {
    return Math.round(Math.random() * (max - min)) + min;
}

@ccclass
export default class DrawTable extends cc.Component {
    /**
     * 图表rect
     */
    @property(cc.Rect)
    rect:cc.Rect = null;

    /**
     * 图表行数
     */
    @property(Number)
    rowCount:number = 0;

    /**
     * 图表列数
     */
    @property(Number)
    columnCount:number = 0;

    /**
     * 动画绘制
     */
    @property
    animate = true; 

    /**
     * 动画绘制时间
     */
    @property
    animateTime = 5;
    /**
     * 行列交织的所有坐标，一维为行坐标(改变x值)，二维维列坐标(改变y值)
     */
    private _points:cc.Vec2[][] = null;

    /**
     * 单前页所有走势点坐标
     */
    private trendsPoint:cc.Vec2[] = [];
    /**
     * 当前页所有走势点的值，用来做提示
     */
    private trendsValues:string[] = [];
    /**
     * 当前提示点的索引
     */
    private currentIndex = -1;

    /**
     * 图表graphic组件，绘制rowCount条直线
     */
    private _graphics:cc.Graphics = null;

    /**
     * 图表走势graphic组件节点，拥有graphic组件，绘制一条条走势折线
     */
    private trendsGraphicsNode:cc.Node = null;
    /**
     * 图表走势点graphic组件节点，拥有graphic组件，绘制个个走势点
     */
    private pointsGraphicsNode:cc.Node = null;
    /**
     * 图表高亮graphic组件节点，拥有graphic组件，绘制个个走势点背后的高亮点
     */
    private highlightGraphicsNode:cc.Node = null;

    /**
     * 提示节点，拥有label组件
     */
    private tipsNode:cc.Node = null;

    onLoad() {
        this.node.setContentSize(this.rect)
        function createGraphicsNode(name:string,parent:cc.Node) {
            const node = new cc.Node(name)
            node.addComponent(cc.Graphics)
            parent.addChild(node)
            return node;
        }
        this.trendsGraphicsNode = createGraphicsNode('trendsGraphicsNode',this.node)
        this.pointsGraphicsNode = createGraphicsNode('highlightGraphicsNode',this.node)
        this.highlightGraphicsNode = createGraphicsNode('pointsGraphicsNode',this.node)
        {
            const gra = this.highlightGraphicsNode.getComponent(cc.Graphics)
            gra.fillColor = cc.color(200,200,0,100);
        }
        {
            this.tipsNode = new cc.Node('tipsNode')
            const label = this.tipsNode.addComponent(cc.Label)
            label.fontSize = 20;
            label.string = '0'
            this.node.addChild(this.tipsNode)
            this.tipsNode.active = false
        }

        this.drawBasicTable()
        this.addTableTitle()
        {
            const t = []
            for (let i = 0; i < this.columnCount; i++) {
                t[i] = random(1,10)
            }
            if (this.animate) {
                this.drawTrendsAnimation(t,this.addEvent.bind(this))
            } else {
                this.addEvent()
                this.drawTrends(t)
            }
        }
    }

    /**
     * 提示事件
     */
    addEvent() {
        // cc.Node.EventType
        const offset = this.rect.width/(this.columnCount - 1) / 2
        const offsety = this.rect.height/2

        cc.log('addEvent',this.node.y - offsety,this.node.y + offsety)
        const call = (event:cc.Event.EventMouse) => {
            event.stopPropagation();
            const p = this.node.convertToNodeSpaceAR(event.getLocation())
            if (event.type == cc.Node.EventType.MOUSE_LEAVE || (p.y < this.node.y - offsety && p.y > this.node.y + offsety)) {
                cc.log('hideTips')
                return this.hideTips()
            }
            
            for (let i = 0; i < this.trendsPoint.length; i++) {
                const tp = this.trendsPoint[i];
                if (p.x < tp.x + offset && p.x > tp.x - offset) {
                    cc.log('showtips')
                    return this.showTips(i,tp)
                }
            }
        }
        this.node.on(cc.Node.EventType.TOUCH_START,call)
        this.node.on(cc.Node.EventType.TOUCH_MOVE,call)
        this.node.on(cc.Node.EventType.MOUSE_ENTER,call)
        this.node.on(cc.Node.EventType.MOUSE_LEAVE,call)
        this.node.on(cc.Node.EventType.MOUSE_MOVE,call)

        let mask = new cc.Node()
        this.node.addChild(mask)
        mask.setContentSize(cc.winSize)
        
        mask.on(cc.Node.EventType.TOUCH_START,(event:cc.Event.EventTouch)=>{
            const p = this.node.convertToNodeSpaceAR(event.getLocation())
            if (!this.rect.contains(p)) {
                this.hideTips()
                event.stopPropagation()
            }   
        })
    }

    drawBasicTable() {
        let _points = this._points = [];
        {
            let x = this.rect.x,y = this.rect.y;
            const offsetx = this.rect.width/(this.columnCount - 1),offsety = this.rect.height/(this.rowCount - 1);
            const v2 = cc.v2;
            for (let i = 0; i < this.columnCount; i++) {
                _points[i] = []
                for (let j = 0; j < this.rowCount; j++) {
                    _points[i][j] = v2(x,y)
                    y += offsety;
                }
                x += offsetx;
                y = this.rect.y;
            }
        }

        const gra = this._graphics = this.addComponent(cc.Graphics);
        this._graphics.lineWidth = 1;
        this._graphics.strokeColor = cc.color(0,200,55,120);
        this._graphics.fillColor = cc.color(0,200,55,120);

        this._graphics.moveTo(this.rect.x,this.rect.y)
        {
            let x = this.rect.x,y = this.rect.y;
            const rect = this.rect;
            const offset = rect.height/(this.rowCount - 1)
            for (let i = 0; i < this.rowCount; i++) {
                gra.lineTo(rect.width + x,y)
                y += offset
                gra.moveTo(x,y)
            }
        }
        this._graphics.stroke()
    }

    addTableTitle() {
        const rowTitle  = ['10','9' ,'8' , '7', '6', '5', '4', '3', '2', '1']
        const colTitile = ['15','16','17','18','19','20','21','22','23','24','25','26','27','28','29']
        if (rowTitle.length < this.rowCount)     return cc.error('行标题长度不对')
        if (colTitile.length < this.columnCount) return cc.error('列标题长度不对')

        let offsetV2 = cc.v2(-15,-12)
        for (let i = 0; i < this.rowCount; i++) {
            const node = new cc.Node();
            node.parent = this.node;
            node.position = this._points[0][i].add(offsetV2)
            node.color = cc.color(0,200,55,120);
            const label = node.addComponent(cc.Label)
            label.fontSize = 20;
            label.string = rowTitle[i]
        }

        offsetV2 = cc.v2(10,-30)
        for (let i = 0; i < this.columnCount; i++) {
            const node = new cc.Node();
            node.parent = this.node;
            node.position = this._points[i][0].add(offsetV2)
            node.color = cc.color(0,200,55,120);
            const label = node.addComponent(cc.Label)
            label.fontSize = 20;
            label.string = colTitile[i]
        }
    }

    drawTrendsAnimation(colContent:number[],callback?:Function) {
        const gra = this.trendsGraphicsNode.getComponent(cc.Graphics);
        gra.strokeColor = cc.Color.RED;

        const pointGra = this.pointsGraphicsNode.getComponent(cc.Graphics)
        pointGra.fillColor = cc.Color.RED;

        let points = colContent.map((e,i)=>{
            const p = this._points[i][e - 1];
            this.trendsPoint[i] = p;
            this.trendsValues[i] = String(10 - e + 1)
            return p;
        });
        /**动画时间 */
        const time = this.animateTime;
        /** 两个开奖点之间的间隔绘制数 */
        const offset_count = Math.floor(time * 60 / (this.columnCount - 1));
        /** 总共需要重复绘制的次数 */
        const repeat = (offset_count - 1) * (this.columnCount - 1) + this.columnCount;
        /** 已经绘制的次数 */
        let has_repeat = 0;
        /** 已经到了第几个点，向上取整 */
        let p_index = 0;
        /** 这个点期间绘制了多少次 */
        let p_i = 0;

        /** 绘制点的坐标x */
        let x = points[0].x;
        /** 绘制点的坐标y */
        let y = points[0].y;

        gra.moveTo(x,y)
        // cc.log('offset_count:',offset_count)
        // cc.log('repeat:',repeat)
        // cc.log(points)

        // let array = [];
        points.push(cc.Vec2.ZERO)
        this.schedule(()=>{
            /** 转折前的起点 */
            const p = points[p_index];
            /** 转折点和转折起点的差值 */
            const o = points[p_index + 1].sub(p);
            /** x轴差值 */
            const ox = o.x / offset_count;
            /** y轴差值 */
            const oy = o.y / offset_count;
            gra.moveTo(x,y)
            x = p.x + ox * p_i;
            y = p.y + oy * p_i;
            if (p_i == 0) {
                pointGra.circle(x,y,5)
                pointGra.fill();
            }
            p_i ++;
            if (p_i == offset_count) {
                p_i = 0;
                p_index ++;
                cc.log('新的一轮',p_index)
            }

            gra.lineTo(x,y)
            gra.stroke()

            has_repeat ++;
            if (has_repeat == repeat) {
                callback && callback()
            }
        },0,repeat - 1,0)
    }

    drawTrends(colContent:number[])   {
        const gra = this.trendsGraphicsNode.getComponent(cc.Graphics);
        gra.strokeColor = cc.Color.RED;

        const pointGra = this.pointsGraphicsNode.getComponent(cc.Graphics)
        pointGra.fillColor = cc.Color.RED;

        const points = this._points;
        cc.log(points)
        for (let i = 0; i < colContent.length; i++) {
            const e = colContent[i];
            const begin = points[i][e - 1];
            this.trendsPoint[i] = begin;
            this.trendsValues[i] = String(10 - e + 1)
            pointGra.circle(begin.x,begin.y,5)
            if (i != 0 ) {
                gra.lineTo(begin.x,begin.y)
            }
            gra.moveTo(begin.x,begin.y)
        }
        gra.stroke()
        pointGra.fill()

        cc.log('values',this.trendsValues)
    }

    showTips(index:number,point:cc.Vec2) {
        if (this.currentIndex == index) return;
        let p = cc.v2()
        point.add(cc.v2(0,5),p)
        this.tipsNode.active = true;
        this.tipsNode.position = p;
        this.tipsNode.getComponent(cc.Label).string = this.trendsValues[index];
        this.currentIndex = index;
        const gra = this.highlightGraphicsNode.getComponent(cc.Graphics)
        gra.clear();
        gra.circle(point.x,point.y,8)
        gra.fill()
    }

    hideTips() {
        if (this.currentIndex == -1) return;
        this.currentIndex = -1;
        this.tipsNode.active = false;
        const gra = this.highlightGraphicsNode.getComponent(cc.Graphics)
        gra.clear();
    }
}
