import React, { Component } from 'react';
import Form from "react-jsonschema-form";
import json2md from 'json2md';
import MDIT from 'markdown-it';

// utils
function cleanArray(actual) {
  if (!actual) {
    return [];
  }
  let newArray = [];
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}
function isURL(str) {
  return /^(https?):\/\/((?:[a-z0-9.-]|%[0-9A-F]{2}){3,})(?::(\d+))?((?:\/(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})*)*)(?:\?((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?(?:#((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?$/i.test(str);
}

function copyTextToClipboard(text) {
  let textArea = document.createElement("textarea");
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = 0;
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    let successful = document.execCommand('copy');
    let msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }
  document.body.removeChild(textArea);
}
// end utils

// consts
const md = new MDIT();

const schema = {
  "type": "object",
  "required": [
  ],
  "properties": {
    "summary": {
      "type": "array",
      "title": "概述",
      "items": {
        "type": "string",
      }
    },
    "thoughts": {
      "type": "array",
      "title": "本周感想",
      "items": {
        "type": "string",
      }
    },
    "tasks": {
      "type": "array",
      "title": "项目详情",
      "items": {
        "type": "object",
        "required": [
          "title"
        ],
        "properties": {
          "title": {
            "type": "string",
            "title": "标题",
          },
          "wiki": {
            "type": "string",
            "title": "项目文档",
            "format": "uri"
          },
          "prd": {
            "type": "string",
            "title": "产品文档",
            "format": "uri"
          },
          "releaseDate": {
            "type": "string",
            "title": "计划上线日期",
            "format": "date"
          },
          "status": {
            "title": "项目状态",
            "type": "string",
            "enum": [
              "开发中",
              "开发完成，待联调",
              "联调中",
              "已提测",
              "测试中",
              "已上线",
            ],
            "default": "开发中",
            "uniqueItems": true
          },
          "progress": {
            "title": "项目进度（%）",
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
            "multipleOf": 10,
            "default": 0
          },
          "background": {
            "type": "array",
            "title": "项目背景",
            "items": {
              "type": "string",
            }
          },
          "target": {
            "type": "array",
            "title": "项目目标",
            "items": {
              "type": "string",
            }
          },
          "details": {
            "type": "array",
            "title": "本周工作内容",
            "items": {
              "type": "string",
            }
          },
          "problems": {
            "type": "array",
            "title": "问题与风险",
            "items": {
              "type": "string",
            }
          }
        }
      }
    },
    "other": {
      "type": "array",
      "title": "其他",
      "items": {
        "type": "string",
      }
    },
    "plans": {
      "type": "array",
      "title": "下周计划",
      "items": {
        "type": "string",
      }
    },
  }
};

const uiSchema = {
  summary: {
    items: {
      "ui:placeholder": '概述',
      // "ui:widget": "textarea"
    }
  },
  thoughts: {
    items: {
      "ui:placeholder": '感想'
    }
  },
  plans: {
    items: {
      "ui:placeholder": '下周计划'
    }
  },
  other: {
    items: {
      "ui:placeholder": '其他'
    }
  },
  tasks: {
    items: {
      title: {
        'ui:placeholder': '项目标题'
      },
      background: {
        items: {
          'ui:placeholder': '项目背景'
        }
      },
      target: {
        items: {
          'ui:placeholder': '项目目标'
        }
      },
      details: {
        items: {
          'ui:placeholder': '本周工作内容'
        }
      },
      problems: {
        items: {
          'ui:placeholder': '问题与风险'
        }
      },
      progress: {
        "ui:widget": "range",
        "ui:options": {
          inline: true
        }
      }
    }
  }
};

let codeMirror = null;

class App extends Component {
  constructor(props) {
    super(props);
    this.onUnload = this.onUnload.bind(this);
    this.state = {
      formData: {
        summary: [],
        thoughts: [],
        tasks: [],
        other: [],
        plans: []
      }
    }
  }
  render() {
    return (
      <div className="App col-md-12">
        <div className="col-md-5 form-section">
          <Form schema={schema}
            uiSchema={uiSchema}
            noValidate={true}
            formData={this.state.formData}
            onChange={({ formData }) => {
              this.setState({ formData });
              codeMirror.setValue(this.mdConvert(formData));
            }}
            onSubmit={(e) => false}>
            <button type="submit" style={{ display: 'none' }}>更新</button>
          </Form>
        </div>
        <div className="col-md-7 fix-content">
          <div className="col-md-5 textarea-section">
            {/* <button className="btn btn-info" style={{marginBottom: '20px', width: '100%'}}>更新markdown</button> */}
            <legend>Markdown源码</legend>

            <textarea></textarea>
          </div>
          <div className="col-md-7 preview-section">
            <button className="col-md-3 btn btn-info btn-sm" onClick={this.updatePreview}><span style={{ fontSize: 'normal' }}>更新预览</span></button>
            <button className="col-md-3 btn btn-info btn-sm" onClick={this.copyMD}><span style={{ fontSize: 'normal' }}>复制md</span></button>
            <button id="cpBtn" className="col-md-3 btn btn-info btn-sm" onClick={this.copyContent}><span style={{ fontSize: 'normal' }}>复制html</span></button>
            <iframe id="preview" frameBorder="0" title="预览"></iframe>
          </div>
        </div>
      </div>
    );
  }
  mdConvert(data) {
    let dataArr = [];
    if (data.summary) {
      dataArr.push(
        { h3: "概述" },
        { ul: cleanArray(data.summary) },
      );
    }
    if (data.thoughts) {
      dataArr.push(
        {
          h3: "感想"
        }, {
          ul: cleanArray(data.thoughts)
        }
      );
    }
    let tasks = [];
    if (data.tasks) {
      data.tasks.map((item) => {
        tasks.push(
          {
            h4: `${(item.title || '项目标题')} \`${item.status}\``
          },
          {
            ul: cleanArray([
              `项目文档: <${isURL(item.wiki) ? item.wiki : '无'}>`,
              `产品文档: <${isURL(item.prd) ? item.prd : '无'}>`,
              `${item.releaseDate ? '计划上线日期: ' + item.releaseDate : ''}`,
              `${item.progress ? '项目整体进度: ' + item.progress + '%' : ''}`,
              `${item.background && item.background.length ? '项目背景:' : ''}`,
              {
                ul: cleanArray(item.background)
              },
              `${item.target && item.target.length ? '项目目标:' : ''}`,
              {
                ul: cleanArray(item.target)
              },
              `${item.details && item.details.length ? '本周工作:' : ''}`,
              {
                ol: cleanArray(item.details)
              },
              `${item.problems && item.problems.length ? '问题与风险:' : ''}`,
              {
                ul: cleanArray(item.problems)
              },
            ])
          }
        );
        return false;
      });
      dataArr.push(
        { h3: "项目详情" }
      );
      dataArr.push(tasks);
    }

    if (data.other && data.other.length) {
      dataArr.push(
        { h3: "其他问题" },
        { ul: cleanArray(data.other) },
      );
    }
    if (data.plans && data.plans.length) {
      dataArr.push(
        { h3: "下周计划" },
        { ul: cleanArray(data.plans) },
      );
    }
    return json2md(dataArr);
  }
  updatePreview() {
    document.getElementById('preview').contentWindow.document.body.innerHTML = md.render(codeMirror.getValue());
  }
  copyMD() {
    copyTextToClipboard(codeMirror.getValue())
  }
  copyContent() {
    let iframeElement = document.getElementById('preview');
    let contentDoc = iframeElement.contentDocument;
    let range = contentDoc.createRange();
    range.selectNode(contentDoc.body);
    let selection = iframeElement.contentWindow.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    contentDoc.execCommand('copy');
  }
  componentDidMount() {
    const lsJSON = JSON.parse(localStorage.getItem('WEEKLY'));
    this.setState({
      formData: lsJSON
    });

    codeMirror = window.CodeMirror.fromTextArea(document.querySelector('.textarea-section>textarea'), {
      lineNumbers: true,
      mode: {
        name: "markdown",
        highlightFormatting: true
      },
      lineWrapping: true,
      tabSize: 2,
      // theme: "default"
    });
    codeMirror.setValue(this.mdConvert(lsJSON));

    //  
    let frame = document.getElementById('preview');
    let doc = frame.contentWindow.document;
    let link = doc.createElement("link");
    doc.title = '周报HTML';
    link.href = 'https://dswwsd.github.io/markdown.css';
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";
    doc.getElementsByTagName("head")[0].appendChild(link);

    // 
    window.addEventListener("beforeunload", this.onUnload);

  }
  onUnload() {
    localStorage.setItem('WEEKLY', JSON.stringify(this.state.formData));
  }
}

export default App;
