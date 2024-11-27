<template>
    <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
        <div class="flex justify-between items-center">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/logs' }">Logs</el-breadcrumb-item>
            </el-breadcrumb>
            <div class="flex flex-row space-x-2">
                <el-button type="success" icon="Refresh" circle @click="fetchLogs()"></el-button>
            </div>
        </div>
        <!-- Filters -->
        <div class="flex flex-row space-x-4 mb-4">
            <div class="w-1/4">
                <el-input v-model="logFilter.asgId" placeholder="ASG ID" clearable @input="fetchLogs"></el-input>
            </div>
            <div class="w-1/4">
                <el-input v-model="logFilter.event" placeholder="Filter by Event" clearable @input="fetchLogs"></el-input>
            </div>
            <div class="w-1/4">
                <el-select v-model="logFilter.level" placeholder="Filter by Level" clearable @change="fetchLogs">
                    <el-option label="SUCCESS" value="SUCCESS"></el-option>
                    <el-option label="ERROR" value="ERROR"></el-option>
                    <el-option label="WARNING" value="WARNING"></el-option>
                    <el-option label="INFO" value="INFO"></el-option>
                </el-select>
            </div>
            <div class="w-1/4">
                <el-date-picker
                class="w-full block"
                v-model="logFilter.timeRange"
                type="datetimerange"
                range-separator="To"
                start-placeholder="Start date"
                end-placeholder="End date"
                value-format="YYYY-MM-DDTHH:mm:ss"
                clearable
                @change="fetchLogs()"
                ></el-date-picker>
            </div>
            <div class="w-1/12">
                <el-button type="primary" icon="Filter" @click="fetchLogs()">Filter</el-button>
            </div>
        </div>
        <el-table :data="logs" v-loading="loading" class="w-full" stripe>
            <el-table-column label="Event">
                <template #default="scope">
                    <div class="flex flex-col justify-start">
                        <b>{{ scope.row.event }}</b>
                        <p class="text-xs">{{ scope.row.id }}</p>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="Log">
                <template #default="scope">
                    <div class="flex flex-col justify-start">
                        <b>{{ scope.row.log }}</b>
                        <p>{{ scope.row.short_description }}</p>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="level" label="Level" align="center" width="100">
                <template #default="scope">
                    <el-tag type="success" v-if="scope.row.level == 'COMPLETED'">{{ scope.row.level }}</el-tag>
                    <el-tag type="success" v-else-if="scope.row.level == 'SUCCESS'">{{ scope.row.level }}</el-tag>
                    <el-tag type="danger" v-else-if="scope.row.level == 'ERROR'">{{ scope.row.level }}</el-tag>
                    <el-tag type="info" v-else>{{ scope.row.level }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="Timestamp" width="150" align="center">
                <template #default="scope">
                    {{ timeAgo(scope.row.timestamp) }}
                </template>
            </el-table-column>
        </el-table>

        <template #footer>
            <div class="flex flex-row justify-end w-full">
                <el-pagination
                layout="total, sizes, prev, pager, next, jumper"
                :page-sizes="[10, 20, 50, 100, 200, 300]"
                v-model:page-size="pageSize"
                v-model:current-page="currentPage"
                :total="totalLogs"
                @size-change="fetchLogs"
                @current-change="fetchLogs"
                class="flex justify-center"
                />
            </div>
        </template>
    </el-card>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                loading: false,
                logs: [],
                totalLogs: 0,
                currentPage: 1,
                pageSize: 10,
                logFilter: {
                    event: '',
                    level: '',
                    timeRange: '',
                },
            };
        },
        mounted() {
            this.fetchLogs();
        },
        methods: {
            fetchLogs() {
                this.loading = true;
                this.makeRequest('post', 'asg-service/v1/asg.listArnLogs', { 
                    asg_id: this.asgId,
                    page: this.currentPage,
                    limit: this.pageSize,
                    event: this.logFilter.event,
                    level: this.logFilter.level,
                    timefrom: (this.logFilter.timeRange) ? this.logFilter.timeRange[0]+'Z' : '',
                    timeto: (this.logFilter.timeRange) ? this.logFilter.timeRange[1]+'Z' : '',
                })
                .then((response) => {
                    this.logs = response.data.results;
                    this.totalLogs = response.data.totalRecords;
                })
                .catch((error) => {
                    console.error('Error fetching logs:', error.response.data);
                    this.$message.error('Error fetching logs: Server responded with an error');
                })
                .finally(() => {
                    this.loading = false;
                });
            }
        },
    };
</script>