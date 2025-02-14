import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Record from "../entities/Record";
import { useState, useEffect } from "react";
import tokenService from "../services/tokenService";
import { API_ADDRESS } from "@/config";
import RecordSmall from "../(screens)/RecordSmall";

const RecordsScreen = () => {
  const [records, setRecords] = useState<Record[]>([]);
  useEffect(() => {
    const fetchRecords = async () => {
      const response = await fetch(`${API_ADDRESS}/records`, {
        headers: {
          Authorization: `Bearer ${await tokenService.getAccessToken()}`,
        },
      });
      const data = await response.json();
      console.log(data);
      setRecords(data);
    };
    fetchRecords();
  }, []);

  return (
    <FlatList
      data={records}
      renderItem={({ item }) => (
        <TouchableOpacity>
          <RecordSmall record={item} />
        </TouchableOpacity>
      )}
    />
  );
};

export default RecordsScreen;
