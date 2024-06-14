<template>
    <div class="search-box" :style="{'--left':tagLeft+'px'}">
        <el-input ref="pInputRef" readonly>
            <template #prefix>
                <div class="search-field" v-size="searchFieldReSize">
                    <el-tag type="info" v-for="item in searchItems" closable @close="remoteSelectItem(item)"
                            color="#F2F4FA">
                        {{
                            item.label
                        }}:{{
                            item.valLabel || item.value
                        }}
                    </el-tag>
                    <div class="select-field" v-show="selectItem?.label">
                        {{ selectItem?.label }}
                    </div>
                </div>
            </template>
            <template #suffix>
                <div style="display: flex;align-items: center">
                    <div v-show="showClear" @click="clearBox" class="clear-box">
                        <el-icon>
                            <CircleClose/>
                        </el-icon>
                    </div>
                    <div class="xian" v-show="showClear"></div>
                    <el-icon :style="{'cursor':iconSubmit? 'pointer':'default'}" @click="submit(1)">
                        <Search/>
                    </el-icon>
                </div>
            </template>
        </el-input>
        <div class="auto-box">
            <el-select v-if="selectItem?.type === EFormItemType.select"
                       v-model="val"
                       ref="autoBox"
                       :multiple="selectItem?.multiple"
                       collapse-tags
                       collapse-tags-tooltip
                       :placeholder="selectItem.placeholder || '请选择'"
                       :disabled="selectItem.disabled"
                       :filterable="selectItem.filterable"
                       :style="{ width: getItemWidth }"
                       @change="keyEnter"
                       clearable>
                <el-option v-for="o in selectItem.options" :value="o.value" :label="o.label" :key="o.value"></el-option>
            </el-select>

            <el-date-picker
                v-else-if="selectItem?.type === EFormItemType.datetimerange || selectItem?.type === EFormItemType.daterange"
                v-model="val"
                ref="autoBox"
                :type="selectItem?.type"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                :value-format=" selectItem?.type === EFormItemType.datetimerange ? 'YYYY-MM-DD HH:mm:ss' :'YYYY-MM-DD' "
                :disabled="selectItem.disabled"
                :default-time=" selectItem.defaultTime || selectItem.default"
                clearable
                style="width:180px"
                @change="keyEnter"
            />
            <component v-model="val"
                       v-else-if="selectItem?.type===EFormItemType.component"
                       :disabled="selectItem.disabled"
                       :style="{ width: getItemWidth }"
                       @change="keyEnter"
                       ref="autoBox"
                       :is="toRaw( itemComponent(<IFormItem>selectItem))"></component>
            <el-autocomplete
                v-else
                ref="autoBox"
                :popper-class="'searchBoxPopper '+searchBoxPopperTip"
                :fetch-suggestions="querySearch"
                v-model="val"
                @select="handleSelect"
                value-key="label"
                @keydown.delete="handleKeyDown"
                @keydown.enter="keyEnter"
                :placeholder="cPlaceholder"
                @focus="autoFocus"
                @blur="autoBlur"
            >
            </el-autocomplete>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {Component, VNode} from 'vue'
import {computed, nextTick, onMounted, PropType, ref, toRaw, watch} from "vue";
import {random, debounce } from "../../lib/common";
import {EFormItemType} from "../../types";
import {IFormItem} from "../../interface";


const props = defineProps({
    modelValue: Object as Record<string, any>,
    placeholder: String,
    fields: {
        type: Array as PropType<Array<IFormItem>>,
        default: () => [],
        required: true
    },
    /**
     * 当输入有值时，是否自动提交
     */
    autoSubmit: Boolean,
    /**
     * 点击搜索icon时是否提交
     */
    iconSubmit: Boolean
})

interface ISelectItem {
    label: string,
    type?: string,
    field: string,
    name?: string,
    value: string,
    //select option value对应的label
    valLabel?: string
}

const emits = defineEmits(['update:modelValue', 'submit'])

const val = ref()
const autoBox = ref();
const pInputRef = ref()

/**
 * 选择了要搜索的字段
 */
const selectItem = ref<IFormItem>()

watch(() => selectItem.value, async (f) => {
    try {
        if (f && (f.field || f.name)) {
            await nextTick()
            autoBox.value?.focus?.();
            if (selectItem.value?.type === EFormItemType.select) {
                autoBox.value.$refs.tooltipRef.onOpen()
            } else if (selectItem.value?.type === EFormItemType.component && selectItem.value.component) {
                //自定义组件是否是下拉框
                let com = selectItem.value.component as VNode
                let cType = com.type as Component
                if (cType && cType.name === 'ElSelect') {
                    autoBox.value.$refs.tooltipRef.onOpen()
                }else{
                    //自定义组件，需要有个 open 函数 和 change函数
                    setTimeout(()=>{
                        //对于异步组件，需要延迟执行
                        autoBox.value.onOpen?.()
                    })
                }
            }
        }
    } catch (e) {
        console.error(e)
    }
}, {
    deep: true
})
const getItemWidth = computed(() => {
    if (selectItem.value && selectItem.value?.width) {
        if (typeof selectItem.value?.width === 'number') {
            return selectItem.value.width + 'px'
        }
        return selectItem.value.width
    }
    return '200px'
})
const showClear = computed(() => {
    return val.value || selectItem.value || searchItems.value.length
})
const cPlaceholder = computed(() => {
    if (selectItem.value) {
        return '添加筛选条件，回车确认'
    }
    if (props.placeholder) {
        return props.placeholder
    }
    if (props.fields.length) {
        return '默认按照' + props.fields[0].label + '搜索'
    }
})
/**
 * 这是最终要搜索的字段
 */
const searchItems = ref<ISelectItem[]>([])

/**
 * 调用提交函数
 */
const submit = (t: number) => {
    if (t && !props.iconSubmit) {
        return
    }
    emits('submit')
}
const sendModelVal = computed(() => {
    // console.log('sendModelVal')
    return searchItems.value.reduce((pre, cur) => {
        pre[cur.field! || cur.name!] = cur.value!
        return pre
    }, {} as Record<string, any>)
})
watch(() => props.modelValue, (a) => {
    if (!a && searchItems.value.length) {
        searchItems.value = []
    }
})
/**
 * 函数介绍：防抖函数封装的发送模型值方法。
 * 详细说明：该方法用于在输入停止后一段时间内，统一发送当前的模型值，并根据配置决定是否自动提交。
 * 使用防抖策略可以减少频繁触发事件带来的性能问题。
 */
const sendModelFun = debounce(()=>{
    // 发送当前模型值到父组件
    emits('update:modelValue', sendModelVal.value)
    // 如果配置了自动提交，则调用提交方法
    if (props.autoSubmit) {
        //自动提交
        submit(0)
    }
})

/**
 * 监听搜索项的变化，并触发发送模型值的方法。
 * 使用深度监听和立即执行，确保搜索项的任何变化都能即时触发值的更新。
 */
watch(() => searchItems.value, () => {
    sendModelFun();
}, {
    deep: true,
    immediate: true
})

/**
 * 候选列表
 * @param queryString
 * @param cb
 */
const querySearch = (queryString: string, cb: any) => {
    if (val.value || selectItem.value) {
        return cb([])
    }
    cb(props.fields)
}
/**
 * 选择要搜索的字段
 * @param item
 */
//@ts-ignore
const handleSelect = (item: IFormItem | Record<string, any>) => {
    selectItem.value = item as IFormItem;
    val.value = ''
}
/**
 * 按下删除键
 * @param e
 */
const handleKeyDown = (e: KeyboardEvent) => {
    if (val.value) {
        return;
    }
    if (selectItem.value) {
        selectItem.value = void 0
        return;
    }
    if (searchItems.value.length) {
        searchItems.value.splice(searchItems.value.length - 1, 1)
    }
}
interface ICurrentComputeValue {
    value:string,
    label:string
}
/**
 * 回车键
 * @param val 自定义组件中 change返回的值是个对象，{ value:string,label:string }
 */
const keyEnter = (result:ICurrentComputeValue) => {
    if (!val.value || !props.fields.length) {
        return;
    }
    if (!selectItem.value) {
        selectItem.value = {...props.fields[0]}
    }
    //查找搜索字段中是否已经有了 searchItems
    let idx = searchItems.value.findIndex(item => {
        if (item.field) {
            return item.field === selectItem.value?.field
        }
        if (item.name) {
            return item.name === selectItem.value?.name
        }
    })
    if (idx > -1) {
        searchItems.value.splice(idx, 1)
    }
    let item: ISelectItem = {
        label: selectItem.value.label!,
        type: selectItem.value.type,
        field: selectItem.value.field!,
        name: (selectItem.value?.name || '') + '',
        value: val.value!
    }
    if (selectItem.value?.type === EFormItemType.datetimerange || EFormItemType.daterange === selectItem.value.type) {
        item.value = val.value
        item.valLabel = val.value.join('至')
    }else if (selectItem.value?.type === EFormItemType.select) {
        //取到选择的option
        let selectOption = selectItem.value.options?.find(it => it.value === val.value)
        if (selectOption) {
            item.valLabel = selectOption.label
        }
    }
    if(typeof result==='object' && result.value && result.label){
        item.value = result.value
        item.valLabel = result.label
    }
    searchItems.value.push(item)
    val.value = ''
    selectItem.value = void 0
    nextTick(() => {
        autoBox.value.blur()
    })
}
/**
 * 清空搜索项目
 */
const clearBox = () => {
    searchItems.value = []
    val.value = ''
    selectItem.value = void 0
    nextTick(() => {
        setTimeout(() => {
            autoBox.value.blur()
            pInputRef.value.blur();
        })

    })
}
const remoteSelectItem = (item: ISelectItem) => {
    searchItems.value = searchItems.value.filter(it => {
        if (it.field) {
            return it.field !== item.field
        }
        if (it.name) {
            return it.name !== item.name
        }
    })
}
const searchBoxPopperTip = ref('a' + random())
const tagLeft = ref(0)
const searchFieldReSize = (a: { width: number, height: number }) => {
    tagLeft.value = a.width + 20
}
const autoFocus = () => {
    let input = pInputRef.value.ref as HTMLInputElement
    input.parentElement!.classList.add('is-focus')
}
const autoBlur = () => {
    let input = pInputRef.value.ref as HTMLInputElement
    input.parentElement!.classList.remove('is-focus')
}

const itemComponent = (item: IFormItem) => {
    //@ts-ignore
    return typeof item.component === 'function' ? item.component.call({}) : item.component
}
onMounted(() => {
    nextTick(() => {
        if (!searchBoxPopperTip.value) {
            return;
        }
        let boxPopper = document.querySelector('.' + searchBoxPopperTip.value) as HTMLDivElement
        if (!boxPopper) {
            return;
        }
        let wrap = boxPopper.querySelector('.el-autocomplete-suggestion__wrap') as HTMLDivElement
        if (!wrap.querySelector('.search-box-tip')) {
            let ul = wrap.querySelector('ul') as HTMLUListElement
            let div = document.createElement('div');
            div.innerHTML = '筛选条件'
            div.classList.add('search-box-tip')

            wrap.insertBefore(div, ul)
        }
        //查找是否有默认的筛选条件 从props.fields中筛选value有值的
        props.fields.forEach(item => {
            if(item.value){
                let def: ISelectItem = {
                    label: item.label!,
                    type: item.type,
                    field: item.field!,
                    name: (item.name || '') + '',
                    value: item.value
                }
                if (item.type === EFormItemType.datetimerange || EFormItemType.daterange === item.type) {
                    def.value = item.value
                    def.valLabel = item.value.join('至')
                }
                if (item.type === EFormItemType.select) {
                    //取到选择的option
                    let selectOption = item.options?.find(it => it.value === item.value)
                    if (selectOption) {
                        def.valLabel = selectOption.label
                    }
                }
                searchItems.value.push(def)
            }
        })
    })
})
</script>

<style scoped lang="scss">
.search-box {
    display: flex;
    align-items: center;
    position: relative;
    min-width: 200px;

    :deep(.el-autocomplete) {
        width: 100%;
    }

    :deep(.el-input__inner) {
        width: 100px;
    }

    .auto-box {
        position: absolute;
        right: 75px;
        left: var(--left);
        //opacity: 0;
        :deep(.el-input__wrapper) {
            background-color: unset;
            box-shadow: unset;
            padding: 0;

            &.is-focus {
                box-shadow: unset;
            }
        }
    }
}

.search-field {
    display: flex;
    align-items: center;
    gap: 5px;

    :deep(.el-tag) {
        color: #666;
        font-size: 13px;
    }
}

.select-field {
    font-size: 14px;
    height: 29px;
    line-height: 29px;
    color: #666666;

    &::after {
        content: ':';
        display: inline-block;
    }
}

.clear-box {
    cursor: pointer;
    width: 25px;
    height: 25px;
    line-height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.xian {
    background-color: #D9D9D9;
    width: 1.5px;
    height: 15px;
    margin-right: 12px;
    margin-left: 12px;
}
</style>
<style>
.searchBoxPopper {
    width: 200px;
    overflow: hidden;
}

.search-box-tip {
    font-weight: 400;
    font-size: 14px;
    color: #BFBFBF;
    line-height: 22px;
    font-style: normal;
    padding-left: 8px;
}
</style>