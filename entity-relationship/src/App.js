import React from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import Container from "react-bootstrap/Container";
import Row from  "react-bootstrap/Row";
import Col from  "react-bootstrap/Col";
import Table from 'react-bootstrap/Table'

const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      tableRender: []
    };
  }

  componentDidMount() {
    // TODO: set up event listeners

    monday.listen("context", this.getContext);
  }

  getContext = (res) => {
    const context = res.data;
    console.log("context!", context);
    this.setState({ context });

    const boardIds = context.boardIds || [context.boardId];
    // const boardIds = [790136548]
    monday
      .api(`query { boards(ids:[${boardIds}]) { id, items { id, column_values { id, value } } }}`)
      .then((res) => {
          console.log(res)

          var tablesData = [];
          var allItemIds = [];
          res.data.boards[0].items.forEach((item, item_index) => {

              console.log(item.id)

              allItemIds.push(item.id);

              var tableColumnItemIds = [];
              item.column_values.forEach((column_value, column_index) => {

                  if(column_value.id == 'subitems' && column_value.value != null){

                      let linkedPulseIds = JSON.parse(column_value.value);

                      console.log(linkedPulseIds);

                      linkedPulseIds.linkedPulseIds.forEach((linkedPulseIdsItem, linkedPulseIdsIndex) => {

                          tableColumnItemIds.push(String(linkedPulseIdsItem.linkedPulseId))
                          allItemIds.push(String(linkedPulseIdsItem.linkedPulseId));
                      });
                  }
              })

              tablesData.push({

                  tableItemId: item.id,
                  tableColumnItemIds: tableColumnItemIds
              });
          });

          this.getTableData(tablesData, allItemIds);
      });
  };

  getTableData(tablesData, allItemIds){

    console.log(tablesData, allItemIds);

    var tableRender = []
    monday
      .api(`query { items (ids:[${allItemIds}]) { id, name, column_values { id, text } }}`)
      .then((res) => {

          console.log(res);

          var responseMap = {};

          res.data.items.forEach((item, itemIndex) => {

              responseMap[item.id] = itemIndex;
          });

          var tablesMap = {}

          tablesData.forEach((tableData, tableIndex) => {

              console.log(res.data.items[responseMap[tableData.tableItemId]].name)

              tablesMap[res.data.items[responseMap[tableData.tableItemId]].name] = tableIndex;
              tableRender.push({

                  name: res.data.items[responseMap[tableData.tableItemId]].name
              });
          });

          console.log(responseMap, tablesMap)

          tablesData.forEach((tableData, tableIndex) => {

              var columns = [];

              tableData.tableColumnItemIds.forEach((tableColumnItemId, tableColumnItemIdIndex) => {

                  var columnType = undefined;
                  var forgienKey = undefined;

                  res.data.items[responseMap[tableColumnItemId]].column_values.forEach((column_value, column_index) => {

                      if(column_value.id == 'dropdown'){

                          columnType = column_value.text;
                      }

                      if(column_value.id != 'dropdown' && column_value.id != 'creation_log' && column_value.id != 'last_updated'){

                          forgienKey = column_value.text;
                      }
                  })

                  if(columnType == 'Foreign'){

                      columns.push({

                          name: res.data.items[responseMap[tableColumnItemId]].name,
                          type: columnType,
                          forgienKeyTable: tablesMap[forgienKey]
                      })
                  }
                  else{

                      columns.push({

                          name: res.data.items[responseMap[tableColumnItemId]].name,
                          type: columnType
                      })
                  }
              });

              tableRender[tableIndex].columns = columns;
          });

          this.setState({ tableRender: tableRender })
      });
  }

  render() {
        return (
            <div className="App">
                <Container fluid>
                    <Row>
                        {this.state.tableRender.map((table, index) => (
                            <Col sm={4} key={index}>
                                <Row>
                                    <Col sm={12}>
                                        <Table striped bordered hover variant="dark">
                                            <thead>
                                                <tr className="text-center">
                                                    <th style={{color: '#007bff'}}>{table.name}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <Container >
                                                            <Row>
                                                                <Col sm={4} style={{color: '#007bff', paddingTop: 10, paddingBottom: 10}}>
                                                                    <b>{table.name + '_ID'}</b>
                                                                    <br />
                                                                    <span style={{color: 'green'}}>Integer</span>
                                                                </Col>
                                                                {
                                                                    table.columns.map((tableColumn, tableIndex) => (

                                                                        <Col sm={4} key={tableIndex} style={{paddingTop: 10, paddingBottom: 10}}>
                                                                            <b style={{color: '#ffc107'}}>{tableColumn.name}</b>
                                                                            <br />
                                                                            {
                                                                                (tableColumn.type == 'Foreign') ?
                                                                                (
                                                                                    <b style={{color: '#007bff'}}>{this.state.tableRender[tableColumn.forgienKeyTable].name + '_ID'}</b>
                                                                                )
                                                                                :
                                                                                (
                                                                                    <span style={{color: 'green'}}>{tableColumn.type}</span>
                                                                                )
                                                                            }
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </Container>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </div>
        );
    }
}

export default App;
