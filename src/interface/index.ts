import {Component} from "vue-demi";
import { EFormItemType } from '../types'
//@ts-ignore
import { ElTooltipProps } from 'element-plus/es/components/tooltip/src/tooltip'

export interface IOption{
    label:string,
    value:string|number|boolean
}
export interface IFilter extends Record<string,any>{
}
export  interface IFormItemBase {
    label?:string,
    labelWidth?:string | number,
    placeholder?:string,
    name:keyof IFilter,
    value?:any,
    default?:any,
    disabled?:boolean,
    rules?:any,
    tooltip?:ElTooltipProps,
    type?:string,
    options?:Array<IOption>,
    component?:Component,
    fields?:Array<IFormItem>,
    multiple?:boolean,
    filterable?:boolean,
    defaultTime?:[Date, Date],
    /**
     * 用于 searchBox 是否自动提交
     */
    autoSubmit?:boolean,
    /**
     * 用于 searchBox 点击搜索icon时是否提交
     */
    iconSubmit?:boolean,
    /**
     * 用于searchBox
     */
    field?:string,
    /**
     * 元素宽度
     */
    width?:number | string
}

interface IFormItemSelect extends IFormItemBase {
    type:EFormItemType.select,
    options: Array<IOption>,
    multiple?:boolean,
}
export  interface IFormItemComponent extends IFormItemBase {
    type:EFormItemType.component,
    component:Component
}
interface IFormItemDatetimerange extends IFormItemBase {
    type:EFormItemType.datetimerange | EFormItemType.daterange,
    defaultTime?:[Date, Date]
}
interface IFormItemInput extends IFormItemBase{
    type:EFormItemType.input
}

interface IFromItemSearchBox extends IFormItemBase{
    fields:Array<IFormItem>
}

export interface IOption{
    label:string,
    value:string|number|boolean
}
export type IFormItem = IFormItemInput | IFormItemSelect | IFormItemComponent | IFormItemDatetimerange |IFromItemSearchBox
